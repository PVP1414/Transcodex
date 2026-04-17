import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HLS_BASE_DIR = path.join(__dirname, '../../uploads/videos');

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

    if (media.access === 'private' && !req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!media.hls || !media.hls.masterPlaylist) {
      return res.status(404).json({ success: false, message: 'HLS not available yet' });
    }

    const playlistPath = path.join(HLS_BASE_DIR, media.hls.masterPlaylist);
    const content = await fs.readFile(playlistPath, 'utf-8');

    const baseUrl = `/api/streaming/${id}/`;
    const tokenQuery = req.query.token ? `?token=${req.query.token}` : '';
    
    const modifiedContent = content
      .split('\n')
      .map(line => {
        if (line.endsWith('.m3u8') || line.endsWith('.ts')) return baseUrl + line + tokenQuery;
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

    if (media.access === 'private' && !req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!media.hls?.qualities) {
      return res.status(404).json({ success: false, message: 'HLS not available' });
    }

    const qualityData = media.hls.qualities.find(q => q.name === quality);
    if (!qualityData) {
      return res.status(404).json({ success: false, message: 'Quality not found' });
    }

    const playlistPath = path.join(HLS_BASE_DIR, qualityData.playlist);
    const content = await fs.readFile(playlistPath, 'utf-8');

    const baseUrl = `/api/streaming/${id}/${quality}/`;
    const tokenQuery = req.query.token ? `?token=${req.query.token}` : '';
    
    const modifiedContent = content
      .split('\n')
      .map(line => {
        if (line.endsWith('.ts')) return baseUrl + line.replace('.ts', '') + tokenQuery;
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

    if (media.access === 'private' && !req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const segmentPath = path.join(HLS_BASE_DIR, id.toString(), quality, `${segment}.ts`);
    
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(segmentPath);
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

    const thumbPath = path.join(HLS_BASE_DIR, media.hls.thumbnailPath);
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(thumbPath);
  } catch (error) {
    res.status(404).json({ success: false, message: 'Thumbnail not found' });
  }
}

export async function getStreamStatus(req, res) {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.json({
      success: true,
      data: {
        mediaId: id,
        status: media.hls?.status || 'pending',
        progress: media.transcodingProgress || 0,
        qualities: media.hls?.qualities?.map(q => q.name) || [],
        hasHLS: !!media.hls?.masterPlaylist
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