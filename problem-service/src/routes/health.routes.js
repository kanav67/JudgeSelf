const express = require('express');

const { getHealth } = require('../controllers/health.controller');

const healthRoutes = express.Router();

healthRoutes.get('/', getHealth);

module.exports = { healthRoutes };