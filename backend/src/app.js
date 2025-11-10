import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mainRouter from './routes/router.js';
import { setUpRole } from './utils/setupRole.js';

const app = express();

dotenv.config();

setUpRole(process.env.ADMIN_UID, 'admin').catch((error) => {
    console.error('Failed to set up admin role:', error);
});


// Middleware
app.use(cors(
  {
    origin: 'http://localhost:5173',
    credentials: true
  }
));

app.use(express.json());

// Routes
app.use('/api', mainRouter);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;