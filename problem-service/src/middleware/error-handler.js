const errorHandler = (error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode ?? 500;

  response.status(statusCode).json({
    message: error.message ?? 'Internal server error',
  });
};

module.exports = { errorHandler };
