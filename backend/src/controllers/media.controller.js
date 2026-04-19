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

    let mimeType = file.mimetype;
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
      hls: { status: 'processing' } // processing for both image and video
    });
    console.log('[MEDIA] Created:', media._id);

    res.status(201).json({ success: true, data: media });

    if (isImage) {
      (async () => {
        try {
          const uploadedFilePath = path.join(__dirname, '../../uploads/', uploadResult.path);
          console.log('[MEDIA] Starting async image processing for:', uploadedFilePath);
          
          await Media.findByIdAndUpdate(media._id, { transcodingProgress: 25 });
          
          const imageInfo = await sharp(uploadedFilePath).metadata();
          dimensions = { width: imageInfo.width, height: imageInfo.height };
          await Media.findByIdAndUpdate(media._id, { transcodingProgress: 50 });

          thumbnail = await createThumbnail(uploadedFilePath, file.originalname, media._id.toString());
          await Media.findByIdAndUpdate(media._id, { transcodingProgress: 75 });

          variants = await createImageVariants(uploadedFilePath, file.originalname, media._id.toString());
          
          media.dimensions = dimensions;
          media.thumbnail = thumbnail;
          media.variants = variants;
          media.transcodingProgress = 100;
          media.hls.status = 'completed';
          await media.save();
          console.log('[MEDIA] Async image processing complete');
        } catch (err) {
          console.error('[MEDIA] Async image error:', err);
          media.hls.status = 'failed';
          await media.save();
        } finally {
          await fs.unlink(file.path).catch(() => {});
        }
      })();
      return;
    }

    if (isVideo) {
      console.log('[MEDIA] Starting HLS transcoding...');
      (async () => {
        try {
          const uploadedFilePath = path.join(__dirname, '../../uploads/', uploadResult.path);
          console.log('[MEDIA] Transcoding from:', uploadedFilePath);
          
          const hlsResult = await videoTranscoder.transcodeToHLS(uploadedFilePath, media._id.toString(), async (percent) => {
            await Media.findByIdAndUpdate(media._id, { transcodingProgress: percent });
          });
        console.log('[MEDIA] HLS result:', hlsResult);
        
        const videoMeta = await videoTranscoder.getVideoMetadata(uploadedFilePath);
        const durationSec = videoMeta?.duration != null ? Number(videoMeta.duration) : null;
        if (durationSec && Number.isFinite(durationSec)) {
          media.duration = durationSec;
        }

        const thumbnailPath = await videoTranscoder.generateThumbnail(uploadedFilePath, media._id.toString());
        console.log('[MEDIA] Thumbnail path:', thumbnailPath);

        let scrubSpritePath;
        let scrub;
        if (durationSec && Number.isFinite(durationSec) && durationSec > 0) {
          const scrubResult = await videoTranscoder.generateScrubSprite(
            uploadedFilePath,
            media._id.toString(),
            durationSec
          );
          if (scrubResult) {
            scrubSpritePath = scrubResult.relativePath;
            scrub = scrubResult.scrub;
          }
        }

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
          thumbnailPath,
          scrubSpritePath,
          scrub,
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
  } catch (error) {
    console.error('[MEDIA] Error:', error);
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createThumbnail(filePath, originalName, mediaId) {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const thumbName = `${name}-thumb.webp`;
  const thumbPath = path.join(__dirname, `../../uploads/images/${mediaId}/thumbnails/${thumbName}`);

  await fs.mkdir(path.dirname(thumbPath), { recursive: true });
  
  await sharp(filePath)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  const relativePath = `images/${mediaId}/thumbnails/${thumbName}`;
  const storage = getStorageAdapter();
  
  return { path: relativePath, url: storage.getUrl(relativePath) };
}

async function createImageVariants(filePath, originalName, mediaId) {
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
      const variantPath = path.join(__dirname, `../../uploads/images/${mediaId}/variants/${variantName}`);

      await fs.mkdir(path.dirname(variantPath), { recursive: true });

      await sharp(filePath)
        .resize(variant.width, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(variantPath);

      const meta = await sharp(variantPath).metadata();
      const relativePath = `images/${mediaId}/variants/${variantName}`;
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

/** Public metadata for share/embed views; private requires owner JWT (optionalAuthenticate). */
export async function getMediaInfo(req, res) {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (media.access === 'private') {
      const uid = req.user?.id?.toString?.() ?? req.user?.id;
      const owner = media.user?.toString?.() ?? media.user;
      if (!uid || uid !== owner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
    }

    res.json({
      success: true,
      data: {
        _id: media._id,
        originalName: media.originalName,
        mediaType: media.mediaType,
        access: media.access,
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

function safeDownloadFilename(name) {
  const base = String(name || 'download').replace(/[\r\n"]/g, '_').trim() || 'download';
  return base;
}

export async function serveMedia(req, res) {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    if (media.access === 'private') {
      const uid = req.user?.id?.toString?.() ?? req.user?.id;
      const owner = media.user?.toString?.() ?? media.user;
      if (!uid || uid !== owner) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
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

    const forceDownload = req.query.download === '1' || req.query.download === 'true';
    if (forceDownload) {
      const filename = safeDownloadFilename(media.originalName);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    await storage.serve(filePath, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
