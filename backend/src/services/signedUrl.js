import jwt from 'jsonwebtoken';
import ApiKey from '../models/ApiKey.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const DEFAULT_EXPIRY_HOURS = 1;
const MAX_EXPIRY_HOURS = 24 * 7;

export async function validateApiKey(apiKey) {
  if (!apiKey) return null;

  const keyDoc = await ApiKey.findOne({ key: apiKey, isActive: true });
  if (!keyDoc) return null;

  if (keyDoc.isExpired()) {
    keyDoc.isActive = false;
    await keyDoc.save();
    return null;
  }

  keyDoc.lastUsedAt = new Date();
  await keyDoc.save();

  return keyDoc;
}

export function generateSignedUrlToken(mediaId, apiKeyId, options = {}) {
  const expiresIn = Math.min(options.expiresIn || DEFAULT_EXPIRY_HOURS, MAX_EXPIRY_HOURS);

  const payload = {
    mediaId,
    apiKeyId,
    type: 'signed-media',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${expiresIn}h`,
  });
}

export function verifySignedUrlToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'signed-media') {
      return null;
    }

    return {
      mediaId: decoded.mediaId,
      apiKeyId: decoded.apiKeyId,
      exp: decoded.exp,
    };
  } catch (err) {
    return null;
  }
}

export function buildSignedUrl(baseUrl, mediaId, token) {
  return `${baseUrl}/api/signed/${token}?mediaId=${mediaId}`;
}

export default {
  validateApiKey,
  generateSignedUrlToken,
  verifySignedUrlToken,
  buildSignedUrl,
};