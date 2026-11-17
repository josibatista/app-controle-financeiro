// Recebe os erros lançados nas rotas e responde sempre no mesmo formato: { mensagem, erros }.
export function tratarErro(erro, req, res, next) {
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'JSON inválido.' });
  }

  // 23505: o banco recusou um valor repetido (restrição UNIQUE).
  if (erro.code === '23505') {
    if (erro.constraint === 'usuarios_email_key') {
      return res.status(409).json({
        mensagem: 'Usuário já cadastrado.',
        erros: { email: 'Já existe um usuário com este e-mail.' },
      });
    }

    if (erro.constraint === 'usuarios_cpf_key') {
      return res.status(409).json({
        mensagem: 'Usuário já cadastrado.',
        erros: { cpf: 'Já existe um usuário com este CPF.' },
      });
    }

    if (erro.table === 'categorias') {
      return res.status(409).json({
        mensagem: 'Já existe uma categoria com esse nome e tipo na sua conta.',
      });
    }

    return res.status(409).json({ mensagem: 'Já existe um registro com esses dados na sua conta.' });
  }

  // 23503: chave estrangeira. Na exclusão, o registro tem vínculos; nos outros casos, o vínculo não existe.
  if (erro.code === '23503') {
    if (req.method === 'DELETE') {
      return res.status(409).json({
        mensagem: 'Este registro possui vínculos e não pode ser excluído.',
      });
    }

    return res.status(400).json({
      mensagem: 'Um dos registros relacionados não existe. Confira os dados informados.',
    });
  }

  if (['RELACIONAMENTO_INVALIDO', 'TIPO_INCOMPATIVEL', 'PARCELAMENTO_INVALIDO'].includes(erro.code)) {
    return res.status(400).json({ mensagem: erro.message });
  }

  if (erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({ mensagem: erro.message });
  }

  console.error(erro);
  return res.status(500).json({ mensagem: 'Não foi possível concluir a operação. Tente novamente.' });
}
