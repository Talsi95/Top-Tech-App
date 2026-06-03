import axios from 'axios';
/**
 * Injects automatic compression and formatting parameters into a Cloudinary URL.
 * Specifically, inserts q_auto,f_auto right after /upload/ in the URL path.
 * 
 * E.g., transforms .../upload/v12345/video.mp4 to .../upload/q_auto,f_auto/v12345/video.mp4
 * 
 * @param {string} url - The original Cloudinary secure URL
 * @returns {string} The optimized Cloudinary URL
 */
export const transformCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string') return '';

    // Check if it's a valid Cloudinary URL containing /upload/
    if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
        return url;
    }

    // Avoid double-injecting if already optimized
    if (url.includes('/upload/q_auto,f_auto/')) {
        return url;
    }

    // Inject q_auto,f_auto right after /upload/
    return url.replace('/upload/', '/upload/q_auto,f_auto/');
};

/**
 * Uploads a video file directly from the browser to Cloudinary (Unsigned Upload)
 * @param {File} file - The video file from the input
 * @param {Function} onProgressCallback - Optional callback function to receive progress percentage (0-100)
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export const uploadVideoToCloudinary = async (file, onProgressCallback = null) => {
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const cloudinaryAxios = axios.create();

    const response = await cloudinaryAxios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            transformRequest: [(data, headers) => {
                if (headers && headers.common) {
                    delete headers.common['x-store-slug'];
                    delete headers.common['Authorization'];
                }
                delete headers['x-store-slug'];
                delete headers['Authorization'];
                return data;
            }],
            onUploadProgress: (progressEvent) => {
                if (onProgressCallback && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgressCallback(percentCompleted);
                }
            }
        }
    );

    return {
        secure_url: response.data.secure_url,
        public_id: response.data.public_id
    };
};
