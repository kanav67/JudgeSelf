const { importProblem } = require("../services/problem-import.service");

const createProblemImport = async (request, response) => {
  const { polygonUrl } = request.body;
  if (!polygonUrl) {
    return response.status(400).json({ message: 'polygonUrl is required' });
  }

  const problemId = await importProblem(polygonUrl);
  response.status(201).json({ problemId });
};

const testEndpoint = async (request, response) => {
  const polygonUrl = "https://polygon.codeforces.com/p3v2ly5/kanav67/first";

  const problemId = await importProblem(polygonUrl);
  response.status(201).json({ problemId });
};

const getProblemById = async (request, response) => {
  response.status(501).json({
    message: 'Problem lookup is not implemented yet.',
    problemId: request.params.problemId,
  });
};

module.exports = {
  createProblemImport,
  getProblemById,
  testEndpoint
};
