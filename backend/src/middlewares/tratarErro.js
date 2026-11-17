export function tratarErro(erro, req, res, next) {
  if (res.headersSent) return next(erro);

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'JSON inválido.' });
  }
  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ mensagem: 'Requisição muito grande.' });
  }

  if (erro.code === '23505') {
    const campo = {
      usuarios_email_key: 'email',
      usuarios_cpf_key: 'cpf',
    }[erro.constraint];

    if (campo) {
      const rotulo = campo === 'cpf' ? 'CPF' : 'e-mail';
      return res.status(409).json({
        mensagem: 'Usuário já cadastrado.',
        erros: { [campo]: `Já existe um usuário com este ${rotulo}.` },
      });
    }

    const mensagem =
      erro.table === 'categorias'
        ? 'Já existe uma categoria com esse nome e tipo na sua conta.'
        : 'Já existe um registro com esses dados na sua conta.';
    return res.status(409).json({ mensagem });
  }

  if (erro.code === '23503') {
    const exclusao = req.method === 'DELETE';
    return res.status(exclusao ? 409 : 400).json({
      mensagem: exclusao
        ? 'Este registro possui vínculos e não pode ser excluído.'
        : 'Um dos registros relacionados não existe. Confira os dados informados.',
    });
  }

  if (
    ['RELACIONAMENTO_INVALIDO', 'TIPO_INCOMPATIVEL', 'PARCELAMENTO_INVALIDO'].includes(
      erro.code,
    )
  ) {
    return res.status(400).json({ mensagem: erro.message });
  }
  if (erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({ mensagem: erro.message });
  }

  console.error('Falha na API:', erro.code || erro.name);
  return res.status(500).json({
    mensagem: 'Não foi possível concluir a operação. Tente novamente.',
  });
}
