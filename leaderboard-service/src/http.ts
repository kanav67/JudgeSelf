import express from 'express';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Leaderboard service listening on port ${port}`);
});

app.get('/leaderboard/:contestId', (req, res) => {
  const contestId = req.params.contestId;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 30;
//   res.json({ contestId, leaderboard: leaderboardData });
});

export { app };