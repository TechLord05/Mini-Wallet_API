const sendSuccess = (res, data, statusCode) => {
    return res.status(statusCode).json({
        success: true,
        data
    });
}

const sendError = (res, message, code, statusCode) => {
    return res.status(statusCode).json({
        success: false,
        error: {
        code: code,
        message: message
        }
    });
}


module.exports = { sendSuccess, sendError }