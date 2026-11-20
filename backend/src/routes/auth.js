import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../config/db.js';
import { JWT_SECRET, JWT_EXPIRACAO } from '../config/jwt.js';
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

const router = Router();

// Limita a 10 tentativas erradas a cada 15 minutos para o mesmo IP.
const limitarTentativas = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
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

  // Usuário, categorias e conta padrão são gravados juntos: se algo falhar, nada fica salvo.
  try {
    await cliente.query('BEGIN');
    const usuario = await Usuario.criar({ ...dados, senhaHash }, cliente);
    await Categoria.criarPadrao(usuario.id, cliente);
    await FonteDestino.criarPadrao(usuario.id, cliente);
    await cliente.query('COMMIT');

    return res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
});

router.post('/login', limitarTentativas, async (req, res) => {
  const { dados, erros } = validarLogin(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({ mensagem: 'Confira os campos informados.', erros });
  }

  const usuario = await Usuario.buscarPorEmail(dados.email);
  const senhaCorreta = usuario && (await bcrypt.compare(dados.senha, usuario.senha_hash));

  // A mensagem é a mesma para e-mail ou senha errados.
  if (!senhaCorreta) {
    return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
  }

  const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: JWT_EXPIRACAO });

  return res.json({ token });
});

router.get('/me', autenticar, async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.usuarioId);

  if (!usuario) {
    return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
  }

  return res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
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

  // Só nome e e-mail vão para o banco; o CPF não pode ser alterado.
  const usuario = await Perfil.atualizarDados(req.usuarioId, dados);

  if (!usuario) {
    return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
  }

  return res.json(usuario);
});

router.put('/senha', autenticar, limitarTentativas, async (req, res) => {
  const { dados, erros } = validarTrocaSenha(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({ mensagem: 'Confira os campos informados.', erros });
  }

  const senhaHash = await Perfil.buscarSenhaHash(req.usuarioId);

  if (!senhaHash) {
    return res.status(401).json({ mensagem: 'Sessão inválida. Entre novamente.' });
  }

  const senhaAtualCorreta = await bcrypt.compare(dados.senhaAtual, senhaHash);

  if (!senhaAtualCorreta) {
    return res.status(400).json({
      mensagem: 'Confira os campos informados.',
      erros: { senhaAtual: 'Senha atual incorreta.' },
    });
  }

  const novoHash = await bcrypt.hash(dados.novaSenha, 10);
  await Perfil.atualizarSenha(req.usuarioId, novoHash);

  return res.status(204).end();
});

router.delete('/perfil', autenticar, limitarTentativas, async (req, res) => {
  const senha = typeof req.body?.senha === 'string'
    ? req.body.senha
    : '';

  if (!senha) {
    return res.status(400).json({
      mensagem: 'Informe sua senha para excluir a conta.',
      erros: { senha: 'Informe sua senha.' },
    });
  }

  const senhaHash = await Perfil.buscarSenhaHash(req.usuarioId);

  if (!senhaHash) {
    return res.status(401).json({
      mensagem: 'Sessão inválida. Entre novamente.',
    });
  }

  const senhaCorreta = await bcrypt.compare(senha, senhaHash);

  if (!senhaCorreta) {
    return res.status(400).json({
      mensagem: 'Senha incorreta.',
      erros: { senha: 'Senha incorreta.' },
    });
  }

  const excluida = await Perfil.excluirConta(req.usuarioId, senhaHash);

  if (!excluida) {
    return res.status(409).json({
      mensagem: 'Os dados da conta foram alterados. Tente novamente.',
    });
  }

  return res.status(204).end();
});

export default router;
