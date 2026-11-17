import 'dotenv/config';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import router from './routes/route.js';
import { criarAuthRouter } from './routes/auth.js';
import { carregarSeguranca } from './config/seguranca.js';
import { tratarErro } from './middlewares/tratarErro.js';

export function criarApp(seguranca = carregarSeguranca()) {
  const app = express();
  app.locals.seguranca = seguranca;
  app.disable('x-powered-by');

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(
    cors({
      origin(origem, callback) {
        if (!origem || seguranca.origens.includes(origem)) {
          return callback(null, true);
        }
        return callback(
          Object.assign(new Error('Origem não autorizada.'), { status: 403 }),
        );
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/auth', criarAuthRouter(seguranca));
  app.use('/api', router);
  app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });
  app.use(tratarErro);
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const porta = Number(process.env.PORT || 3000);
  criarApp().listen(porta, '127.0.0.1', () => {
    console.log(`API disponível em http://127.0.0.1:${porta}`);
  });
}
