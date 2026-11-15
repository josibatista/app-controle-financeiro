import express from 'express';
import routes from './routes/route.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});