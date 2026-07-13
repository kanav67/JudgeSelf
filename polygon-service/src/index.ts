import { env } from './config/env';
import { initializeTmpDir } from './services/problem-import.service';
import { checkHealth as checkPostgres } from './config/postgres';
import { checkHealth as checkS3 } from './config/s3';
import { app } from './http/app';

async function bootstrap() {
  await initializeTmpDir();

  await checkPostgres();
  await checkS3();

  app.listen(env.port, () => {
    console.log(`Problem service listening on port ${env.port}`);
  });
};

bootstrap();