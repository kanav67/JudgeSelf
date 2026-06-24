import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { routes } from './routes/index.js';
import { env } from './config/env.js';
import { initializeTmpDir } from './services/problem-import.service.js';
import { checkHealth as checkPostgres } from './config/postgres.js';
import { checkHealth as checkS3 } from './config/s3.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await initializeTmpDir();

  await checkPostgres();
  await checkS3();

  app.listen(env.port, () => {
    console.log(`Problem service listening on port ${env.port}`);
  });
};

startServer();

export { app };