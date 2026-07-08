import amqp from 'amqplib';
import { env } from './env';

export let rmqChannel: amqp.Channel;

export const InitRabbitMQ = async () => {
  const connection = await amqp.connect(env.rabbitURL);
  rmqChannel = await connection.createChannel();
  await rmqChannel.assertQueue(env.rabbitQueue, { durable: true });
  console.log('RabbitMQ connection established');
}