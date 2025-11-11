module.exports = (err, req, res, next) => {
    console.error('Error caught by central handler:', err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

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
