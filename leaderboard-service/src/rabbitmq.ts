import { Connection } from 'rabbitmq-client'

export interface QueueMessage {
  submission_id: string;
  status: string;
  user_id: string;
  contest_id: string;
  problem_index: string;
}
