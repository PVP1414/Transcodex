import Media from '../models/Media.js';
import { canAccessMedia, denyMediaAccess } from '../utils/mediaAccess.js';
import { getStorageAdapter } from '../services/storage/index.js';

function buildAccessQuery(req) {
  const params = new URLSearchParams();
  if (req.query.token) params.set('token', req.query.token);
  if (req.query.apiKey) params.set('apiKey', req.query.apiKey);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getMasterPlaylist(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (media.mediaType !== 'video') {
      return res.status(400).json({ success: false, message: 'Not a video file' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    if (!media.hls || !media.hls.masterPlaylist) {
      return res.status(404).json({ success: false, message: 'HLS not available yet' });
    }

    const storage = getStorageAdapter();
    const content = await storage.readText(`videos/${media.hls.masterPlaylist}`);

    const baseUrl = `/api/streaming/${id}/`;
    const accessQuery = buildAccessQuery(req);
    
    const modifiedContent = content
      .split('\n')
      .map(line => {
        if (line.endsWith('.m3u8') || line.endsWith('.ts')) return baseUrl + line + accessQuery;
        return line;
      })
      .join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(modifiedContent);
  } catch (error) {
    console.error('[STREAM] Error serving master playlist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQualityPlaylist(req, res) {
  try {
    const { id, quality } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    if (!media.hls?.qualities) {
      return res.status(404).json({ success: false, message: 'HLS not available' });
    }

    const qualityData = media.hls.qualities.find(q => q.name === quality);
    if (!qualityData) {
      return res.status(404).json({ success: false, message: 'Quality not found' });
    }

    const storage = getStorageAdapter();
    const content = await storage.readText(`videos/${qualityData.playlist}`);

    const baseUrl = `/api/streaming/${id}/${quality}/`;
    const accessQuery = buildAccessQuery(req);
    
    const modifiedContent = content
      .split('\n')
      .map(line => {
        if (line.endsWith('.ts')) return baseUrl + line.replace('.ts', '') + accessQuery;
        return line;
      })
      .join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(modifiedContent);
  } catch (error) {
    console.error('[STREAM] Error serving quality playlist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSegment(req, res) {
  try {
    const { id, quality, segment } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    const segmentPath = `videos/${id}/${quality}/${segment}.ts`;
    const storage = getStorageAdapter();
    
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    await storage.serve(segmentPath, res);
  } catch (error) {
    console.error('[STREAM] Error serving segment:', error);
    res.status(404).json({ success: false, message: 'Segment not found' });
  }
}

export async function getVideoThumbnail(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media || !media.hls?.thumbnailPath) {
      return res.status(404).json({ success: false, message: 'Thumbnail not found' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    const thumbPath = `videos/${media.hls.thumbnailPath}`;
    const storage = getStorageAdapter();
    res.setHeader('Content-Type', 'image/jpeg');
    await storage.serve(thumbPath, res);
  } catch (error) {
    res.status(404).json({ success: false, message: 'Thumbnail not found' });
  }
}

export async function getScrubSprite(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media || !media.hls?.scrubSpritePath) {
      return res.status(404).json({ success: false, message: 'Scrub sprite not found' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    const spritePath = `videos/${media.hls.scrubSpritePath}`;
    const storage = getStorageAdapter();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    await storage.serve(spritePath, res);
  } catch (error) {
    res.status(404).json({ success: false, message: 'Scrub sprite not found' });
  }
}

export async function getStreamStatus(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    const scrubDoc = media.hls?.scrub;
    const scrubAvailable = !!(media.hls?.scrubSpritePath && scrubDoc?.cols && scrubDoc?.frameCount);

    res.json({
      success: true,
      data: {
        mediaId: id,
        status: media.hls?.status || 'pending',
        progress: media.transcodingProgress || 0,
        qualities: media.hls?.qualities?.map(q => q.name) || [],
        hasHLS: !!media.hls?.masterPlaylist,
        scrub: scrubAvailable
          ? {
              available: true,
              cols: scrubDoc.cols,
              rows: scrubDoc.rows,
              frameCount: scrubDoc.frameCount,
              cellWidth: scrubDoc.cellWidth,
              cellHeight: scrubDoc.cellHeight,
              intervalSec: scrubDoc.intervalSec,
            }
          : { available: false },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAvailableQualities(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (!canAccessMedia(media, req.user, req.apiKey)) {
      return denyMediaAccess(res);
    }

    if (!media.hls?.qualities) {
      return res.json({
        success: true,
        data: { available: false, qualities: [] }
      });
    }

    res.json({
      success: true,
      data: {
        available: true,
        qualities: media.hls.qualities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
