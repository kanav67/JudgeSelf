const notFound = (request, response) => {
  response.status(404).json({
    message: 'Route not found',
    path: request.originalUrl,
  });
};

module.exports = { notFound };
