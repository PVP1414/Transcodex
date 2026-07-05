import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import { getStorageAdapter } from '../storage/index.js';

const SCRUB_CELL_W = 160;
const SCRUB_CELL_H = 90;
const SCRUB_MIN_FRAMES = 8;
const SCRUB_MAX_FRAMES = 80;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HLS_QUALITIES = [
  { name: '360p', width: 640, height: 360, bitrate: '800k' },
  { name: '480p', width: 854, height: 480, bitrate: '1400k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2800k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
];

export class VideoTranscoder {
  constructor() {
    this.storage = getStorageAdapter();
    this.outputDir = path.join(__dirname, '../../../uploads/videos');
  }

  async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.m3u8':
        return 'application/vnd.apple.mpegurl';
      case '.ts':
        return 'video/mp2t';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }

  async uploadDirectory(localDir, remotePrefix) {
    const entries = await fs.readdir(localDir, { withFileTypes: true });

    for (const entry of entries) {
      const localPath = path.join(localDir, entry.name);
      const remotePath = `${remotePrefix}/${entry.name}`.replace(/\\/g, '/');

      if (entry.isDirectory()) {
        await this.uploadDirectory(localPath, remotePath);
        continue;
      }

      if (entry.isFile()) {
        await this.storage.uploadFile(localPath, remotePath, {
          mimetype: this.getContentType(localPath),
        });
      }
    }
  }

  async transcodeToHLS(inputPath, mediaId, onProgress) {
    const outputDir = path.join(this.outputDir, mediaId.toString());
    await this.ensureDir(outputDir);

    const tasks = HLS_QUALITIES.map((quality, index) => 
      this.transcodeQuality(inputPath, outputDir, quality, mediaId, index === HLS_QUALITIES.length - 1 ? onProgress : null)
    );

    await Promise.all(tasks);

    await this.createMasterPlaylist(outputDir, mediaId);
    await this.uploadDirectory(outputDir, `videos/${mediaId}`);

    return {
      masterPlaylist: `${mediaId}/playlist.m3u8`,
      qualities: HLS_QUALITIES.map(q => ({
        name: q.name,
        playlist: `${mediaId}/${q.name}.m3u8`
      }))
    };
  }

  async transcodeQuality(inputPath, outputDir, quality, mediaId, onProgress) {
    const qualityDir = path.join(outputDir, quality.name);
    await this.ensureDir(qualityDir);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=${quality.width}:-2`,
          `-b:v ${quality.bitrate}`,
          `-b:a 128k`,
          '-c:v libx264',
          '-c:a aac',
          '-hls_time 10',
          '-hls_playlist_type vod',
          `-hls_segment_filename ${qualityDir}/segment%d.ts`,
          '-start_number 1'
        ])
        .output(path.join(outputDir, `${quality.name}.m3u8`))
        .on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.round(progress.percent));
          }
        })
        .on('end', () => {
          console.log(`[TRANSCODE] ${quality.name} complete`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[TRANSCODE] ${quality.name} failed:`, err.message);
          resolve();
        })
        .run();
    });
  }

  async createMasterPlaylist(outputDir, mediaId) {
    const lines = ['#EXTM3U', '#EXT-X-VERSION:3'];
    
    for (const quality of HLS_QUALITIES) {
      const bandwidth = parseInt(quality.bitrate) * 1000;
      lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${Math.floor(quality.width * 9/16)}`);
      lines.push(`${quality.name}.m3u8`);
    }

    await fs.writeFile(
      path.join(outputDir, 'playlist.m3u8'),
      lines.join('\n')
    );
  }

  async generateThumbnail(inputPath, mediaId) {
    const thumbnailDir = path.join(this.outputDir, mediaId.toString(), 'thumbnails');
    await this.ensureDir(thumbnailDir);
    
    const thumbnailPath = path.join(thumbnailDir, 'thumb.jpg');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-ss 00:00:01', '-vframes 1', '-s 320x180'])
        .output(thumbnailPath)
        .on('end', () => {
          console.log('[TRANSCODE] Thumbnail generated');
          this.storage
            .uploadFile(thumbnailPath, `videos/${mediaId}/thumbnails/thumb.jpg`, {
              mimetype: 'image/jpeg',
            })
            .then(() => resolve(`${mediaId}/thumbnails/thumb.jpg`))
            .catch((err) => reject(err));
        })
        .on('error', (err) => {
          console.error('[TRANSCODE] Thumbnail failed:', err.message);
          resolve(null);
        })
        .run();
    });
  }

  async getVideoMetadata(inputPath) {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          resolve(null);
          return;
        }
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        resolve({
          duration: metadata.format.duration,
          width: videoStream?.width,
          height: videoStream?.height,
          codec: videoStream?.codec_name
        });
      });
    });
  }

  /**
   * Builds a tiled JPEG sprite for timeline scrub previews (two-pass: extract frames, then tile).
   * @returns {{ relativePath: string, scrub: object } | null}
   */
  async generateScrubSprite(inputPath, mediaId, durationSec) {
    const duration = Number(durationSec);
    if (!duration || duration <= 0 || !Number.isFinite(duration)) {
      console.warn('[TRANSCODE] Scrub skipped: invalid duration');
      return null;
    }

    let n = Math.min(SCRUB_MAX_FRAMES, Math.max(SCRUB_MIN_FRAMES, Math.round(duration / 4)));
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const totalFrames = cols * rows;
    const intervalSec = duration / totalFrames;

    const thumbnailDir = path.join(this.outputDir, mediaId.toString(), 'thumbnails');
    await this.ensureDir(thumbnailDir);
    const scrubPath = path.join(thumbnailDir, 'scrub.jpg');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `awt-scrub-${mediaId}-`));

    const scalePad = `scale=${SCRUB_CELL_W}:${SCRUB_CELL_H}:force_original_aspect_ratio=decrease,pad=${SCRUB_CELL_W}:${SCRUB_CELL_H}:(ow-iw)/2:(oh-ih)/2`;
    const fpsExpr = `fps=1/${intervalSec}`;
    const vfExtract = `${fpsExpr},${scalePad}`;
    const cellPattern = path.join(tmpDir, 'cell_%04d.jpg');

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions(['-vf', vfExtract, '-an', '-frames:v', String(totalFrames)])
          .output(cellPattern)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(cellPattern)
          .inputOptions(['-start_number', '1'])
          .outputOptions(['-vf', `tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3'])
          .output(scrubPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      await this.storage.uploadFile(scrubPath, `videos/${mediaId}/thumbnails/scrub.jpg`, {
        mimetype: 'image/jpeg',
      });

      console.log('[TRANSCODE] Scrub sprite generated:', totalFrames, 'cells', cols, 'x', rows);
      return {
        relativePath: `${mediaId}/thumbnails/scrub.jpg`,
        scrub: {
          cols,
          rows,
          frameCount: totalFrames,
          cellWidth: SCRUB_CELL_W,
          cellHeight: SCRUB_CELL_H,
          intervalSec,
        },
      };
    } catch (err) {
      console.error('[TRANSCODE] Scrub sprite failed:', err.message);
      await fs.unlink(scrubPath).catch(() => {});
      return null;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async deleteHLSFiles(mediaId) {
    const outputDir = path.join(this.outputDir, mediaId.toString());
    try {
      await this.storage.deletePrefix(`videos/${mediaId}`);
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (err) {
      console.error('[TRANSCODE] Cleanup failed:', err.message);
    }
  }
}

export default new VideoTranscoder();
