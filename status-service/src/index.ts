import { app } from './http/app';
import { env } from './config/env';
import { InitRedis } from './config/redis';
import { checkHealth } from './config/postgres';
import { Subscribe } from './services/status.service';

async function bootstrap() {
  await checkHealth();
  await InitRedis();

  await Subscribe();


  app.listen(env.port, () => {
    console.log(`Leaderboard Service running on port: ${env.port}`);
  });
}

bootstrap();