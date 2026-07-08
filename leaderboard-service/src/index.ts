import { app } from './http/app';
import { env } from './config/env';
import { InitPostgres } from './config/postgres';
import { InitRedis } from './config/redis';
import { InitRabbitMQ } from './config/rabbitmq';
import { StartFreezeTask } from './tasks/freeze.task';
import { StartRabbitMQ } from './tasks/rabbitmq.task';

async function bootstrap() {
  await InitPostgres();
  await InitRedis();
  await InitRabbitMQ();

  StartFreezeTask();
  StartRabbitMQ();    

  app.listen(env.port, () => {
    console.log(`Leaderboard Service running on port: ${env.port}`);
  });
}

bootstrap();