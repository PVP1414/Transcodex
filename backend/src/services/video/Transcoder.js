import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { getStorageAdapter } from '../storage/index.js';

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

  async transcodeToHLS(inputPath, mediaId) {
    const outputDir = path.join(this.outputDir, mediaId.toString());
    await this.ensureDir(outputDir);

    const tasks = HLS_QUALITIES.map(quality => 
      this.transcodeQuality(inputPath, outputDir, quality, mediaId)
    );

    await Promise.all(tasks);

    await this.createMasterPlaylist(outputDir, mediaId);

    return {
      masterPlaylist: `${mediaId}/playlist.m3u8`,
      qualities: HLS_QUALITIES.map(q => ({
        name: q.name,
        playlist: `${mediaId}/${q.name}.m3u8`
      }))
    };
  }

  async transcodeQuality(inputPath, outputDir, quality, mediaId) {
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
          resolve(`${mediaId}/thumbnails/thumb.jpg`);
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

  async deleteHLSFiles(mediaId) {
    const outputDir = path.join(this.outputDir, mediaId.toString());
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch (err) {
      console.error('[TRANSCODE] Cleanup failed:', err.message);
    }
  }
}

export default new VideoTranscoder();