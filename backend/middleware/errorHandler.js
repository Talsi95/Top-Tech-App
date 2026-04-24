/**
 * Central Error Handling Middleware.
 * Catches all errors from async handlers or next(err) calls.
 * Returns a standardized JSON response based on the environment.
 * @param {Error} err - The error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
module.exports = (err, req, res, next) => {
    console.error('Error caught by central handler:', err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Handle Mongoose validation errors specifically.
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};
