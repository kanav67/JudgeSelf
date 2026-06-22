const getHealth = (request, response) => {
  response.json({
    status: 'ok',
    service: 'problem-service',
  });
};

module.exports = { getHealth };
