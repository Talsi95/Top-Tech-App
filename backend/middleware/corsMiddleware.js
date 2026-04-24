const cors = require('cors');

/**
 * CORS configuration options.
 * Restricts access to allowed origins and enables credentials.
 */
const corsOptions = {
  origin: function (origin, callback) {
    /**
     * List of allowed origins for CORS.
     * Requests from these origins will be permitted.
     */
    const allowedOrigins = [
      'http://localhost:5001',
      'http://localhost:5173',
      'http://localhost',
      'http://127.0.0.1'
    ];
    // Allow requests with no origin (like mobile apps or curl) or if the origin is in the allowlist.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked from origin: " + origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  /**
   * Enables the use of credentials (cookies, authorization headers) with CORS requests.
   */
  credentials: true
};

/**
 * Express middleware for handling Cross-Origin Resource Sharing (CORS).
 * Configured with specific options to control access.
 */
module.exports = cors(corsOptions);
