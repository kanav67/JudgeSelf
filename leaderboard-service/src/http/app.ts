import { Router } from 'express';
import { getLeaderboard, getUserLeaderboardInfo, forceRecalculateUser, forceRecalculateContest } from './controller';
import express from 'express';

export const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export const router = Router();
app.use('/api', router);

router.get('/leaderboard/:contestId/user/:userId', getUserLeaderboardInfo);
router.get('/leaderboard/:contestId{/:page}', getLeaderboard);//keep it below

router.post('/leaderboard/:contestId/recalculate/user/:userId', forceRecalculateUser);
router.post('/leaderboard/:contestId/recalculate/contest', forceRecalculateContest);