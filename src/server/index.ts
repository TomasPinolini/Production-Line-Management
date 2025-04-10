import express from 'express';
import cors from 'cors';
import participantTypesRouter from './routes/participantTypes';
import participantsRouter from './routes/participants';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Production Line Management API is running' });
});

// Routes
app.use('/api/participant-types', participantTypesRouter);
app.use('/api/participants', participantsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 