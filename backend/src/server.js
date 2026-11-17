import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes/route.js';
import authRouter from './routes/auth.js';
import { tratarErro } from './middlewares/tratarErro.js';

const app = express();
const porta = process.env.PORT || 3000;

// Endereços do frontend que podem acessar a API, separados por vírgula no .env.
const origens = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origem) => origem.trim());

app.use(cors({ origin: origens }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api', router);

app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

app.use(tratarErro);

app.listen(porta, () => {
  console.log(`API disponível em http://localhost:${porta}`);
});
