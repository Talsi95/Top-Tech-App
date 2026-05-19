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
