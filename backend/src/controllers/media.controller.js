import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';
import { getStorageAdapter } from '../services/storage/index.js';
import videoTranscoder from '../services/video/Transcoder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function uploadMedia(req, res) {
  console.log('[MEDIA] Upload called');
  try {
    if (!req.file) {
      console.log('[MEDIA] No file in request');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    console.log('[MEDIA] File received:', file.originalname, file.size, file.mimetype);

    const mimeType = file.mimetype;
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }

    if (file.size > MAX_FILE_SIZE) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(400).json({ success: false, message: 'File too large' });
    }

    const storage = getStorageAdapter();
    const mediaType = isImage ? 'image' : 'video';
    const folder = `${mediaType}s`;
    
    let dimensions = null;
    let thumbnail = null;
    let variants = [];

    if (isImage) {
      console.log('[MEDIA] Getting image metadata...');
      try {
        const imageInfo = await sharp(file.path).metadata();
        console.log('[MEDIA] Image metadata:', imageInfo.width, 'x', imageInfo.height);
        dimensions = { width: imageInfo.width, height: imageInfo.height };

        console.log('[MEDIA] Creating thumbnail...');
        thumbnail = await createThumbnail(file.path, file.originalname);
        console.log('[MEDIA] Thumbnail created');

        console.log('[MEDIA] Creating variants...');
        variants = await createImageVariants(file.path, file.originalname);
        console.log('[MEDIA] Variants created:', variants.length);
      } catch (sharpError) {
        console.error('[MEDIA] Sharp error:', sharpError);
      }
    }

    console.log('[MEDIA] Uploading to storage...');
    const uploadResult = await storage.upload(file, { folder });
    console.log('[MEDIA] Uploaded to:', uploadResult.path);

    console.log('[MEDIA] Creating database record...');
    const media = await Media.create({
      filename: uploadResult.path,
      originalName: file.originalname,
      mimeType,
      mediaType,
      size: file.size,
      path: uploadResult.path,
      url: storage.getUrl(uploadResult.path),
      thumbnail,
      dimensions,
      variants,
      access: req.body.access || 'public',
      user: req.user.id,
      hls: { status: 'pending' }
    });
    console.log('[MEDIA] Created:', media._id);

    if (isVideo) {
      console.log('[MEDIA] Starting HLS transcoding...');
      media.hls.status = 'processing';
      await media.save();

      res.status(201).json({ success: true, data: media });

      (async () => {
        try {
          const uploadedFilePath = path.join(__dirname, '../../uploads/', uploadResult.path);
          console.log('[MEDIA] Transcoding from:', uploadedFilePath);
          
          const hlsResult = await videoTranscoder.transcodeToHLS(uploadedFilePath, media._id.toString(), async (percent) => {
            await Media.findByIdAndUpdate(media._id, { transcodingProgress: percent });
          });
        console.log('[MEDIA] HLS result:', hlsResult);
        
        const thumbnailPath = await videoTranscoder.generateThumbnail(uploadedFilePath, media._id.toString());
        console.log('[MEDIA] Thumbnail path:', thumbnailPath);

        if (thumbnailPath) {
          media.thumbnail = {
            path: `videos/${thumbnailPath}`,
            url: storage.getUrl(`videos/${thumbnailPath}`)
          };
        }

        media.hls = {
          masterPlaylist: hlsResult.masterPlaylist,
          qualities: hlsResult.qualities,
          status: 'completed',
          thumbnailPath
        };
        media.transcodingProgress = 100;
        await media.save();
        console.log('[MEDIA] HLS transcoding complete');
        } catch (transcodeError) {
          console.error('[MEDIA] HLS transcoding failed:', transcodeError);
          media.hls.status = 'failed';
          await media.save();
        } finally {
          await fs.unlink(file.path).catch(() => {});
        }
      })();
      return;
    }

    await fs.unlink(file.path).catch(() => {});

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    console.error('[MEDIA] Error:', error);
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createThumbnail(filePath, originalName) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const thumbName = `${name}-thumb.webp`;
  const thumbPath = path.join(__dirname, `../../uploads/thumbnails/${thumbName}`);

  await fs.mkdir(path.dirname(thumbPath), { recursive: true });
  
  await sharp(filePath)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  const relativePath = `thumbnails/${thumbName}`;
  const storage = getStorageAdapter();
  
  return { path: relativePath, url: storage.getUrl(relativePath) };
}

async function createImageVariants(filePath, originalName) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const variants = [];
  const sizes = [
    { name: 'small', width: 480 },
    { name: 'medium', width: 800 },
    { name: 'large', width: 1200 },
  ];

  const originalMeta = await sharp(filePath).metadata();

  for (const variant of sizes) {
    if (originalMeta.width > variant.width) {
      const variantName = `${name}-${variant.name}.webp`;
      const variantPath = path.join(__dirname, `../../uploads/variants/${variantName}`);

      await fs.mkdir(path.dirname(variantPath), { recursive: true });

      await sharp(filePath)
        .resize(variant.width, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(variantPath);

      const meta = await sharp(variantPath).metadata();
      const relativePath = `variants/${variantName}`;
      const storage = getStorageAdapter();

      variants.push({
        name: variant.name,
        path: relativePath,
        url: storage.getUrl(relativePath),
        width: meta.width,
        height: meta.height,
        size: (await fs.stat(variantPath)).size,
        format: 'webp',
      });
    }
  }

  return variants;
}

export async function listMedia(req, res) {
  try {
    const { page = 1, limit = 20, type, access } = req.query;
    const query = { user: req.user.id };

    if (type) query.mediaType = type;
    if (access) query.access = access;

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Media.countDocuments(query);

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listPublicMedia(req, res) {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { access: 'public' };

    if (type) query.mediaType = type;

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Media.countDocuments(query);

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMediaById(req, res) {
  try {
    const media = await Media.findOne({ _id: req.params.id, user: req.user.id });

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteMedia(req, res) {
  try {
    const media = await Media.findOne({ _id: req.params.id, user: req.user.id });

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const storage = getStorageAdapter();
    await storage.delete(media.path);

    if (media.thumbnail?.path) {
      await storage.delete(media.thumbnail.path);
    }

    if (media.mediaType === 'video') {
      await videoTranscoder.deleteHLSFiles(media._id.toString());
    }

    for (const variant of media.variants || []) {
      await storage.delete(variant.path);
    }

    await Media.findByIdAndDelete(media._id);

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMedia(req, res) {
  try {
    const { access, originalName } = req.body;
    const updates = {};

    if (access) updates.access = access;
    if (originalName) updates.originalName = originalName;

    const media = await Media.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true }
    );

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function serveMedia(req, res) {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (media.access === 'private' && !req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const storage = getStorageAdapter();
    const variant = req.query.variant;
    
    let filePath = media.path;
    if (variant && media.variants) {
      const found = media.variants.find(v => v.name === variant);
      if (found) filePath = found.path;
    }

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    await storage.serve(filePath, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
