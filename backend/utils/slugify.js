/**
 * Generates a clean, SEO-friendly slug from a text string.
 * Supports both English and Hebrew characters, converting spaces and special characters to hyphens.
 *
 * @param {string} text - The text to be converted to a slug.
 * @returns {string} The formatted slug string.
 */
function slugify(text) {
    if (!text || typeof text !== 'string') return '';

    // Convert to lowercase (useful for English characters) and trim whitespace
    let slug = text.trim().toLowerCase();

    // Replace all non-alphanumeric, non-Hebrew, non-space, non-hyphen characters with spaces
    // Hebrew Unicode range is \u0590-\u05FF
    slug = slug.replace(/[^a-z0-9\u0590-\u05FF\s-]/g, ' ');

    // Replace whitespace (spaces, tabs, newlines) and consecutive hyphens with a single hyphen
    slug = slug.replace(/[\s-]+/g, '-');

    // Remove leading and trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '');

    return slug;
}

module.exports = slugify;
