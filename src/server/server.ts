import express from 'express';
import cors from 'cors';
import assetsRouter from './routes/assets';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assets', assetsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 