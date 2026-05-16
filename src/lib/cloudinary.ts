import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { decrypt } from './encryption';

/**
 * Get Cloudinary configuration from database
 */
async function getCloudinaryConfig() {
  const configs = await db.systemConfiguration.findMany({
    where: {
      key: {
        in: ['cloudinary_cloud_name', 'cloudinary_api_key', 'cloudinary_api_secret']
      }
    }
  });

  const configMap: Record<string, string> = {};
  configs.forEach((config: any) => {
    configMap[config.key] = config.isEncrypted ? decrypt(config.value) : config.value;
  });

  if (!configMap.cloudinary_cloud_name || !configMap.cloudinary_api_key || !configMap.cloudinary_api_secret) {
    return null;
  }

  return {
    cloud_name: configMap.cloudinary_cloud_name,
    api_key: configMap.cloudinary_api_key,
    api_secret: configMap.cloudinary_api_secret,
  };
}

/**
 * Upload an image to Cloudinary
 * @param fileBuffer The file buffer to upload
 * @param fileName Original filename (used for public_id)
 * @param folder Cloudinary folder name
 */
export async function uploadToCloudinary(fileBuffer: Buffer, fileName: string, folder: string = 'journey-to-africa') {
  const config = await getCloudinaryConfig();
  
  if (!config) {
    console.warn('Cloudinary config missing, falling back to local storage is not supported for this helper.');
    return null;
  }

  cloudinary.config(config);

  return new Promise((resolve, reject) => {
    const baseName = fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `${baseName}_${Date.now()}`;

    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    ).end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary
 * @param publicId The Cloudinary public_id (can be extracted from URL)
 */
export async function deleteFromCloudinary(publicId: string) {
  const config = await getCloudinaryConfig();
  
  if (!config) {
    console.warn('Cloudinary config missing, skipping Cloudinary deletion.');
    return null;
  }

  cloudinary.config(config);

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
}

/**
 * Helper to extract public_id from Cloudinary URL
 * @param url Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null;
  
  // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/public_id.jpg
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Everything after vXXXXXXXXX/ is the public_id (including folders, excluding extension)
    const afterUpload = parts.slice(uploadIndex + 1);
    
    // Remove version tag (vXXXXXX) if present
    if (afterUpload[0].startsWith('v')) {
      afterUpload.shift();
    }
    
    const publicIdWithExt = afterUpload.join('/');
    const publicId = publicIdWithExt.split('.')[0];
    
    return publicId;
  } catch (error) {
    console.error('Failed to extract public ID:', error);
    return null;
  }
}
