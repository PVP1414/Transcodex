import { Router } from 'express';
import { validateApiKey, generateSignedUrlToken, verifySignedUrlToken } from '../services/signedUrl.js';
import Media from '../models/Media.js';
import { getStorageAdapter } from '../services/storage/index.js';

const router = Router();

router.get('/info/:mediaId', async (req, res) => {
  try {
    const apiKeyHeader = req.headers['x-api-key'] || req.query.apiKey;
    const { mediaId } = req.params;

    if (!apiKeyHeader) {
      return res.status(401).json({ success: false, message: 'API key is required' });
    }

    if (!mediaId) {
      return res.status(400).json({ success: false, message: 'mediaId is required' });
    }

    const apiKeyDoc = await validateApiKey(apiKeyHeader);
    if (!apiKeyDoc) {
      return res.status(401).json({ success: false, message: 'Invalid or expired API key' });
    }

    if (!['read', 'read-write', 'admin'].includes(apiKeyDoc.permissions)) {
      return res.status(403).json({ success: false, message: 'API key does not have read permission' });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.json({
      success: true,
      data: {
        _id: media._id,
        originalName: media.originalName,
        mediaType: media.mediaType,
        access: media.access,
        url: media.url,
        size: media.size,
        mimeType: media.mimeType,
        dimensions: media.dimensions,
        duration: media.duration,
        thumbnail: media.thumbnail,
        variants: media.variants,
        transcodingProgress: media.transcodingProgress,
        hls: media.hls,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const apiKeyHeader = req.headers['x-api-key'] || req.query.apiKey;
    const { mediaId, expiresInHours } = req.body;

    if (!apiKeyHeader) {
      return res.status(401).json({ success: false, message: 'API key is required' });
    }

    if (!mediaId) {
      return res.status(400).json({ success: false, message: 'mediaId is required' });
    }

    const apiKeyDoc = await validateApiKey(apiKeyHeader);
    if (!apiKeyDoc) {
      return res.status(401).json({ success: false, message: 'Invalid or expired API key' });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (!['read', 'read-write', 'admin'].includes(apiKeyDoc.permissions)) {
      return res.status(403).json({ success: false, message: 'API key does not have read permission' });
    }

    const token = generateSignedUrlToken(mediaId, apiKeyDoc._id.toString(), {
      expiresIn: expiresInHours,
    });

    const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const signedUrl = `${baseUrl}/api/signed/${token}?mediaId=${mediaId}`;

    res.json({
      success: true,
      data: {
        signedUrl,
        expiresIn: expiresInHours || 1,
        mediaId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const apiKeyHeader = req.headers['x-api-key'];

    const decoded = verifySignedUrlToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid or expired signed URL' });
    }

    const media = await Media.findById(decoded.mediaId);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const storage = getStorageAdapter();
    const { query } = req;

    let filePath = media.path;
    if (query.variant && media.variants) {
      const found = media.variants.find(v => v.name === query.variant);
      if (found) filePath = found.path;
    }
    if (query.thumbnail === '1' || query.thumbnail === 'true') {
      if (media.thumbnail?.path) filePath = media.thumbnail.path;
    }

    const ext = filePath.split('.').pop().toLowerCase();
    const contentTypes = {
      webp: 'image/webp',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      m3u8: 'application/x-mpegURL',
      ts: 'video/MP2T',
    };

    res.setHeader('Content-Type', contentTypes[ext] || media.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    await storage.serve(filePath, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;