import { Router } from 'express';
import express from 'express';
import { createProblemImport, testEndpoint } from '../http/controller';

export const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const problemsRoutes = Router();
problemsRoutes.post('/import', createProblemImport);
problemsRoutes.get('/test', testEndpoint);
app.use('/api/problems', problemsRoutes);