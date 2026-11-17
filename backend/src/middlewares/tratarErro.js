export function tratarErro(erro, req, res, next) {
  if (res.headersSent) return next(erro);

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }
  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Requisição muito grande.' });
  }

  if (erro.code === '23505') {
    const campo = {
      usuarios_email_key: 'email',
      usuarios_cpf_key: 'cpf',
    }[erro.constraint];

    if (campo) {
      const rotulo = campo === 'cpf' ? 'CPF' : 'e-mail';
      return res.status(409).json({
        erro: 'Usuário já cadastrado.',
        campos: { [campo]: `Já existe um usuário com este ${rotulo}.` },
      });
    }

    const mensagem =
      erro.table === 'categorias'
        ? 'Já existe uma categoria com esse nome e tipo na sua conta.'
        : 'Já existe um registro com esses dados na sua conta.';
    return res.status(409).json({ erro: mensagem });
  }

  if (erro.code === '23503') {
    return res.status(409).json({
      erro: 'Este registro possui vínculos e não pode ser excluído.',
    });
  }

  if (
    ['RELACIONAMENTO_INVALIDO', 'TIPO_INCOMPATIVEL', 'PARCELAMENTO_INVALIDO'].includes(
      erro.code,
    )
  ) {
    return res.status(400).json({ erro: erro.message });
  }
  if (erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  console.error('Falha na API:', erro.code || erro.name);
  return res.status(500).json({
    erro: 'Não foi possível concluir a operação. Tente novamente.',
  });
}
