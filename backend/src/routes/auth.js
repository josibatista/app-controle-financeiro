import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../config/db.js';
import * as Usuario from '../models/usuario.js';
import * as Categoria from '../models/categoria.js';
import * as FonteDestino from '../models/fonteDestino.js';
import * as Perfil from '../models/perfil.js';
import {
  validarCadastro,
  validarLogin,
  validarPerfil,
  validarTrocaSenha,
} from '../models/validarUsuario.js';
import { autenticar } from '../middlewares/autenticar.js';

function dadosPublicos(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

export function criarAuthRouter(seguranca) {
  const router = Router();
  const hashComparacao = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);
  const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { mensagem: 'Muitas tentativas. Aguarde 15 minutos para tentar novamente.' },
  });

  router.post('/cadastro', async (req, res) => {
    const { dados, erros } = validarCadastro(req.body);
    if (Object.keys(erros).length) {
      return res.status(400).json({ mensagem: 'Confira os campos informados.', erros });
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const usuario = await Usuario.criar({ ...dados, senhaHash }, cliente);
      await Categoria.criarPadrao(usuario.id, cliente);
      await FonteDestino.criarPadrao(usuario.id, cliente);
      await cliente.query('COMMIT');
      return res.status(201).json(dadosPublicos(usuario));
    } catch (erro) {
      await cliente.query('ROLLBACK');
      throw erro;
    } finally {
      cliente.release();
    }
  });

  router.post('/login', limitarLogin, async (req, res) => {
    const { dados, erros } = validarLogin(req.body);
    if (Object.keys(erros).length) {
      return res.status(400).json({ mensagem: 'Confira os campos informados.', erros });
    }

    const usuario = await Usuario.buscarPorEmail(dados.email);
    const senhaCorreta = await bcrypt.compare(
      dados.senha,
      usuario?.senha_hash || hashComparacao,
    );
    if (!usuario || !senhaCorreta) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign({}, seguranca.jwtSecret, {
      algorithm: 'HS256',
      subject: String(usuario.id),
      expiresIn: seguranca.duracaoToken,
      issuer: 'controle-financeiro',
      audience: 'controle-financeiro-web',
    });
    return res.json({ token, usuario: dadosPublicos(usuario) });
  });

  router.get('/me', autenticar, async (req, res) => {
    const usuario = await Usuario.buscarPorId(req.usuarioId);
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
    }
    return res.json({
      ...dadosPublicos(usuario),
      expiraEm: req.expiracaoToken * 1000,
    });
  });

  router.get('/perfil', autenticar, async (req, res) => {
    const usuario = await Perfil.buscar(req.usuarioId);
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
    }
    return res.json(usuario);
  });

  router.put('/perfil', autenticar, async (req, res) => {
    const { dados, erros } = validarPerfil(req.body);
    if (Object.keys(erros).length) {
      return res.status(400).json({ mensagem: 'Confira os campos informados.', erros });
    }

    const usuario = await Perfil.atualizarDados(req.usuarioId, dados);
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
    }
    return res.json(usuario);
  });

  router.put('/senha', autenticar, limitarLogin, async (req, res) => {
    const { dados, erros } = validarTrocaSenha(req.body);
    if (Object.keys(erros).length) {
      return res.status(400).json({ mensagem: 'Confira os campos informados.', erros });
    }

    const senhaHash = await Perfil.buscarSenhaHash(req.usuarioId);
    if (!senhaHash) {
      return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
    }
    if (!(await bcrypt.compare(dados.senhaAtual, senhaHash))) {
      return res.status(400).json({
        mensagem: 'Confira os campos informados.',
        erros: { senhaAtual: 'Senha atual incorreta.' },
      });
    }

    await Perfil.atualizarSenha(req.usuarioId, await bcrypt.hash(dados.novaSenha, 10));
    return res.status(204).end();
  });

  return router;
}
