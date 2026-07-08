import { env } from "../config/env";
import { rmqChannel } from "../config/rabbitmq";
import { processLiveVerdict } from "../services/redis.service";

export interface QueueMessage {
  submissionId: string;
  contestId: string;
  userId: string;
  problemId: string;
  status: 'AC' | 'WA' | 'TLE' | 'MLE' | 'CE' | 'RE';
  relativeSubmittedAt: number;
}

//convert json
const keyMap: Record<string, string> = {
  submission_id: 'submissionId',
  contest_id: 'contestId',
  user_id: 'userId',
  problem_id: 'problemId',
  status: 'status',
  relative_submission_time: 'relativeSubmittedAt'
};

function reviver(this: any, key: string, value: any) {
  if (keyMap[key]) {
    this[keyMap[key]] = value;
    return;
  }
  return value;
};

export const StartRabbitMQ = async () => {
  rmqChannel.consume(env.rabbitQueue, async (msg) => {
    if (!msg) return;

    try {
      const verdict: QueueMessage = JSON.parse(msg.content.toString(), reviver);
      await processLiveVerdict(verdict);
      rmqChannel.ack(msg);
    } catch (error) {
      console.error('Failed to process message from consumer queue:', error);
      rmqChannel.nack(msg, false, true);
    }
  });
}

