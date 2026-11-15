import 'dotenv/config';
import express from 'express';
import categoriasRouter from './routes/categorias.js';
import fontesDestinosRouter from './routes/fontesDestinos.js';

const app = express();

app.disable('x-powered-by');

app.use(express.json({ limit: '16kb' }));

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api/categorias', categoriasRouter);
app.use('/api/fontes-destinos', fontesDestinosRouter);

app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'JSON inválido.' });
  }

  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ mensagem: 'Requisição muito grande.' });
  }

  if (erro.code === '23505') {
    return res.status(409).json({
      mensagem: 'Já existe uma categoria com esse nome e tipo na sua conta.',
    });
  }

  if (erro.code === '23503') {
    return res.status(409).json({
      mensagem:
        'Esta categoria possui lançamentos associados e não pode ser excluída.',
    });
  }

  if (erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({
      mensagem: erro.message,
    });
  }

  console.error(erro);

  return res.status(500).json({
    mensagem: 'Não foi possível concluir a operação. Tente novamente.',
  });
});

const porta = Number(process.env.PORT ?? 3000);

app.listen(porta, '127.0.0.1', () => {
  console.log(`API disponível em http://127.0.0.1:${porta}`);
});