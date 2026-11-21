import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Campo from '../Campo.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  alterarSenha,
  atualizarPerfil,
  consultarPerfil,
  excluirConta,
} from '../../services/autenticacao.js';
import { formatarCpf } from '../../services/cpf.js';
import { validarCampoCadastro } from '../../services/validarCadastro.js';
import './Perfil.css';

const senhasVazias = { senhaAtual: '', novaSenha: '', confirmacaoSenha: '' };

function validarCampoSenha(campo, senhas) {
  if (campo === 'senhaAtual') {
    return senhas.senhaAtual ? '' : 'Informe sua senha atual.';
  }
  const dados = { senha: senhas.novaSenha, confirmacaoSenha: senhas.confirmacaoSenha };
  if (campo === 'novaSenha') {
    return senhas.novaSenha ? validarCampoCadastro('senha', dados) : 'Informe a nova senha.';
  }
  return senhas.confirmacaoSenha
    ? validarCampoCadastro('confirmacaoSenha', dados)
    : 'Confirme a nova senha.';
}

function primeiroErro(erros) {
  return Object.keys(erros).find((campo) => erros[campo]);
}

export default function Perfil() {
  const { atualizarUsuario, logout } = useAuth();
  const navigate = useNavigate();
  const dialogoExclusao = useRef(null);

  const [etapaExclusao, setEtapaExclusao] = useState(null);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [erroExclusao, setErroExclusao] = useState('');
  const [mensagemExclusao, setMensagemExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const [perfil, setPerfil] = useState(null);
  const [carregamento, setCarregamento] = useState({ status: 'carregando', erro: '' });
  const [tentativa, setTentativa] = useState(0);

  const [dados, setDados] = useState({ nome: '', email: '' });
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [senhas, setSenhas] = useState(senhasVazias);
  const [errosSenha, setErrosSenha] = useState({});
  const [mensagemSenha, setMensagemSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  useEffect(() => {
    document.title = 'Meu perfil';
  }, []);

  // Busca os dados do perfil ao abrir a tela.
  useEffect(() => {
    setCarregamento({ status: 'carregando', erro: '' });

    consultarPerfil()
      .then((usuario) => {
        setPerfil(usuario);
        setDados({ nome: usuario.nome, email: usuario.email });
        setCarregamento({ status: 'pronto', erro: '' });
      })
      .catch((erro) => setCarregamento({ status: 'erro', erro: erro.message }));
  }, [tentativa]);

  const dadosAlterados =
    perfil !== null && (dados.nome !== perfil.nome || dados.email !== perfil.email);

  function alterarDados(event) {
    const { name, value } = event.target;
    const proximos = { ...dados, [name]: value };
    setDados(proximos);
    setMensagem('');
    setSucesso('');
    if (erros[name]) {
      setErros((atuais) => ({ ...atuais, [name]: validarCampoCadastro(name, proximos) }));
    }
  }

  function validarDadosAoSair(event) {
    const { name } = event.target;
    setErros((atuais) => ({ ...atuais, [name]: validarCampoCadastro(name, dados) }));
  }

  function cancelarDados() {
    setDados({ nome: perfil.nome, email: perfil.email });
    setErros({});
    setMensagem('');
    setSucesso('');
  }

  async function salvarDados(event) {
    event.preventDefault();
    if (salvando) return;
    const formulario = event.currentTarget;
    const novosErros = {
      nome: validarCampoCadastro('nome', dados),
      email: validarCampoCadastro('email', dados),
    };
    setErros(novosErros);
    setMensagem('');
    setSucesso('');
    if (primeiroErro(novosErros)) {
      formulario.elements.namedItem(primeiroErro(novosErros))?.focus();
      return;
    }

    setSalvando(true);
    try {
      const usuario = await atualizarPerfil(dados);
      setPerfil(usuario);
      setDados({ nome: usuario.nome, email: usuario.email });
      atualizarUsuario(usuario);
      setSucesso('Dados atualizados.');
    } catch (erro) {
      const errosServidor = erro.erros ?? {};
      setErros({ nome: errosServidor.nome, email: errosServidor.email });
      setMensagem(erro.message || 'Não foi possível salvar seus dados. Tente novamente.');
      if (primeiroErro(errosServidor)) {
        formulario.elements.namedItem(primeiroErro(errosServidor))?.focus();
      }
    } finally {
      setSalvando(false);
    }
  }

  function alterarCampoSenha(event) {
    const { name, value } = event.target;
    const proximas = { ...senhas, [name]: value };
    setSenhas(proximas);
    setMensagemSenha('');
    setSucessoSenha('');
    setErrosSenha((atuais) => {
      const novos = { ...atuais };
      if (atuais[name]) novos[name] = validarCampoSenha(name, proximas);
      if (name === 'novaSenha' && atuais.confirmacaoSenha) {
        novos.confirmacaoSenha = validarCampoSenha('confirmacaoSenha', proximas);
      }
      return novos;
    });
  }

  function validarSenhaAoSair(event) {
    const { name } = event.target;
    setErrosSenha((atuais) => ({ ...atuais, [name]: validarCampoSenha(name, senhas) }));
  }

  async function salvarSenha(event) {
    event.preventDefault();
    if (alterandoSenha) return;
    const formulario = event.currentTarget;
    const novosErros = Object.fromEntries(
      Object.keys(senhasVazias).map((campo) => [campo, validarCampoSenha(campo, senhas)]),
    );
    setErrosSenha(novosErros);
    setMensagemSenha('');
    setSucessoSenha('');
    if (primeiroErro(novosErros)) {
      formulario.elements.namedItem(primeiroErro(novosErros))?.focus();
      return;
    }

    setAlterandoSenha(true);
    try {
      await alterarSenha(senhas);
      setSenhas(senhasVazias);
      setErrosSenha({});
      setSucessoSenha('Senha alterada.');
    } catch (erro) {
      const errosServidor = erro.erros ?? {};
      setErrosSenha(errosServidor);
      setMensagemSenha(
        erro.message || 'Não foi possível alterar sua senha. Tente novamente.',
      );
      if (primeiroErro(errosServidor)) {
        formulario.elements.namedItem(primeiroErro(errosServidor))?.focus();
      }
    } finally {
      setAlterandoSenha(false);
    }
  }

  useEffect(() => {
    const modal = dialogoExclusao.current;
    if (!modal) return;

    if (etapaExclusao && !modal.open) {
      modal.showModal();
    } else if (!etapaExclusao && modal.open) {
      modal.close();
    }
  }, [etapaExclusao]);

  function abrirExclusao(event) {
    event.preventDefault();

    if (excluindo) return;

    setMensagemExclusao('');

    if (!senhaExclusao.trim()) {
      setErroExclusao('Informe sua senha atual.');
      return;
    }

    setErroExclusao('');
    setEtapaExclusao('aviso');
  }

  function fecharExclusao() {
    if (excluindo) return;

    setEtapaExclusao(null);
    setSenhaExclusao('');
    setErroExclusao('');
    setMensagemExclusao('');
  }

  async function confirmarExclusao() {
    if (excluindo || etapaExclusao !== 'aviso') return;

    setExcluindo(true);
    setErroExclusao('');
    setMensagemExclusao('');

    try {
      await excluirConta(senhaExclusao);

      // Conta excluída: encerra a sessão e retorna ao login.
      logout();
      navigate('/login', { replace: true });
    } catch (erro) {
      // Retorna ao formulário para corrigir a senha ou tentar novamente.
      setEtapaExclusao(null);
      setSenhaExclusao('');
      setErroExclusao(erro.erros?.senha || '');
      setMensagemExclusao(
        erro.erros?.senha
          ? ''
          : erro.message || 'Não foi possível excluir a conta.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  if (carregamento.status !== 'pronto') {
    return (
      <section className="fl-perfil">
        <h1>Meu perfil</h1>
        {carregamento.status === 'carregando' ? (
          <p className="fl-perfil-aviso">
            Carregando seus dados...
          </p>
        ) : (
          <div className="fl-perfil-aviso">
            <p className="fl-alert">
              {carregamento.erro}
            </p>
            <button
              className="fl-text-button"
              type="button"
              onClick={() => setTentativa(tentativa + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="fl-perfil">
      <h1>Meu perfil</h1>
      <p className="fl-perfil-descricao">Gerencie seus dados e o acesso à sua conta.</p>

      <section className="fl-perfil-secao">
        <div className="fl-perfil-secao-titulo">
          <h2>Dados pessoais</h2>
          <p>Informações usadas no seu cadastro.</p>
        </div>
        <form className="fl-perfil-formulario" onSubmit={salvarDados} noValidate>
          <div className="fl-perfil-campos">
            <div className="fl-perfil-campo-completo">
              <Campo
                id="perfil-nome"
                name="nome"
                label="Nome completo"
                autoComplete="name"
                maxLength={120}
                value={dados.nome}
                onChange={alterarDados}
                onBlur={validarDadosAoSair}
                erro={erros.nome}
                marcarObrigatorio
                required
              />
            </div>
            <div className="fl-perfil-campo-completo">
              <Campo
                id="perfil-email"
                name="email"
                label="E-mail"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={160}
                value={dados.email}
                onChange={alterarDados}
                onBlur={validarDadosAoSair}
                erro={erros.email}
                informacao="Esse e-mail será usado para entrar na conta. Cada e-mail pode ser cadastrado uma única vez."
                marcarObrigatorio
                required
              />
            </div>
            <div className="fl-perfil-campo-completo">
              <Campo
                id="perfil-cpf"
                name="cpf"
                label="CPF"
                value={formatarCpf(perfil.cpf)}
                disabled
                ajuda="O CPF não pode ser alterado."
              />
            </div>
          </div>
          <div className="fl-perfil-acoes">
            <button
              className="fl-perfil-botao"
              type="button"
              onClick={cancelarDados}
              disabled={!dadosAlterados || salvando}
            >
              Cancelar
            </button>
            <button
              className="fl-perfil-botao fl-perfil-botao--principal"
              type="submit"
              disabled={!dadosAlterados || salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
          {sucesso && (
            <p className="fl-perfil-status">
              {sucesso}
            </p>
          )}
          {mensagem && (
            <p className="fl-alert">
              {mensagem}
            </p>
          )}
        </form>
      </section>

      <section className="fl-perfil-secao">
        <div className="fl-perfil-secao-titulo">
          <h2>Alterar senha</h2>
          <p>Escolha uma nova senha para acessar sua conta.</p>
        </div>
        <form className="fl-perfil-formulario" onSubmit={salvarSenha} noValidate>
          <div className="fl-perfil-campos">
            <div className="fl-perfil-campo-completo">
              <Campo
                id="perfil-senha-atual"
                name="senhaAtual"
                label="Senha atual"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha atual"
                value={senhas.senhaAtual}
                onChange={alterarCampoSenha}
                onBlur={validarSenhaAoSair}
                erro={errosSenha.senhaAtual}
                marcarObrigatorio
                required
              />
            </div>
            <Campo
              id="perfil-senha-nova"
              name="novaSenha"
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              placeholder="Crie uma nova senha"
              value={senhas.novaSenha}
              onChange={alterarCampoSenha}
              onBlur={validarSenhaAoSair}
              erro={errosSenha.novaSenha}
              ajuda="Use pelo menos 8 caracteres, com letras e números."
              marcarObrigatorio
              required
            />
            <Campo
              id="perfil-senha-confirmacao"
              name="confirmacaoSenha"
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={senhas.confirmacaoSenha}
              onChange={alterarCampoSenha}
              onBlur={validarSenhaAoSair}
              erro={errosSenha.confirmacaoSenha}
              marcarObrigatorio
              required
            />
          </div>
          <div className="fl-perfil-acoes">
            <button
              className="fl-perfil-botao fl-perfil-botao--principal"
              type="submit"
              disabled={alterandoSenha}
            >
              {alterandoSenha ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </div>
          {sucessoSenha && (
            <p className="fl-perfil-status">
              {sucessoSenha}
            </p>
          )}
          {mensagemSenha && (
            <p className="fl-alert">
              {mensagemSenha}
            </p>
          )}
        </form>
      </section>

      <section className="fl-perfil-secao">
        <div className="fl-perfil-secao-titulo">
          <h2>Excluir conta</h2>
          <p>
            Exclua permanentemente sua conta e os dados associados.
          </p>
        </div>

        <form
          className="fl-perfil-formulario"
          onSubmit={abrirExclusao}
          noValidate
        >
          <div className="fl-perfil-campos">
            <div className="fl-perfil-campo-completo">
              <Campo
                id="perfil-senha-exclusao"
                name="senha"
                label="Senha atual"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha atual"
                value={senhaExclusao}
                onChange={(event) => {
                  setSenhaExclusao(event.target.value);
                  setErroExclusao('');
                  setMensagemExclusao('');
                }}
                erro={erroExclusao}
                marcarObrigatorio
                required
                disabled={excluindo}
              />
            </div>
          </div>

          <div className="fl-perfil-acoes">
            <button
              type="submit"
              className="fl-perfil-botao fl-perfil-botao--excluir"
              disabled={excluindo}
            >
              Excluir minha conta
            </button>
          </div>

          {mensagemExclusao && (
            <p className="fl-alert" role="alert">
              {mensagemExclusao}
            </p>
          )}
        </form>
      </section>
      
      <dialog
        ref={dialogoExclusao}
        className="fl-perfil-dialogo"
        aria-labelledby="fl-exclusao-titulo"
        onCancel={(event) => {
          event.preventDefault();
          fecharExclusao();
        }}
      >
        <h2 id="fl-exclusao-titulo">
          Realmente deseja excluir sua conta?
        </h2>

        <p>
          Ao confirmar, sua conta e todos os dados associados
          serão excluídos permanentemente, incluindo informações
          pessoais, categorias, fontes/destinos, cartões de crédito,
          lançamentos e faturas.
        </p>

        <p>
          <strong>Esta ação não poderá ser desfeita.</strong>
        </p>

        <div className="fl-perfil-acoes">
          <button
            type="button"
            className="fl-perfil-botao"
            onClick={fecharExclusao}
            disabled={excluindo}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="fl-perfil-botao fl-perfil-botao--perigo"
            onClick={confirmarExclusao}
            disabled={excluindo}
          >
            {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
          </button>
        </div>
      </dialog>


    </section>
  );
}
