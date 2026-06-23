const express = require('express');

const { errorHandler } = require('./middleware/error-handler');
const { notFound } = require('./middleware/not-found');
const { routes } = require('./routes');
const { env } = require('./config/env');
const { initializeTmpDir } = require('./services/problem-import.service');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await initializeTmpDir();

  await require('./config/postgres').checkHealth();
  await require('./config/s3').checkHealth();

  app.listen(env.port, () => {
    console.log(`Problem service listening on port ${env.port}`);
  });
};

startServer();
  
module.exports = { app };