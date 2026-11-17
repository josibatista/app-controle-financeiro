import { useEffect, useState } from 'react';
import Campo from '../Campo.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  alterarSenha,
  atualizarPerfil,
  consultarPerfil,
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
  const { atualizarUsuario } = useAuth();
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

  useEffect(() => {
    const controlador = new AbortController();
    setCarregamento({ status: 'carregando', erro: '' });
    consultarPerfil({ signal: controlador.signal })
      .then((usuario) => {
        setPerfil(usuario);
        setDados({ nome: usuario.nome, email: usuario.email });
        setCarregamento({ status: 'pronto', erro: '' });
      })
      .catch((erro) => {
        if (erro.name !== 'AbortError') {
          setCarregamento({ status: 'erro', erro: erro.message });
        }
      });
    return () => controlador.abort();
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

  if (carregamento.status !== 'pronto') {
    return (
      <section className="fl-perfil" aria-labelledby="titulo-perfil">
        <h1 id="titulo-perfil">Meu perfil</h1>
        {carregamento.status === 'carregando' ? (
          <p className="fl-perfil-aviso" role="status">
            Carregando seus dados...
          </p>
        ) : (
          <div className="fl-perfil-aviso">
            <p className="fl-alert" role="alert">
              {carregamento.erro}
            </p>
            <button
              className="fl-text-button"
              type="button"
              onClick={() => setTentativa((valor) => valor + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="fl-perfil" aria-labelledby="titulo-perfil">
      <h1 id="titulo-perfil">Meu perfil</h1>
      <p className="fl-perfil-descricao">Gerencie seus dados e o acesso à sua conta.</p>

      <section className="fl-perfil-secao" aria-labelledby="titulo-dados-pessoais">
        <div className="fl-perfil-secao-titulo">
          <h2 id="titulo-dados-pessoais">Dados pessoais</h2>
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
            <p className="fl-perfil-status" role="status">
              {sucesso}
            </p>
          )}
          {mensagem && (
            <p className="fl-alert" role="alert">
              {mensagem}
            </p>
          )}
        </form>
      </section>

      <section className="fl-perfil-secao" aria-labelledby="titulo-alterar-senha">
        <div className="fl-perfil-secao-titulo">
          <h2 id="titulo-alterar-senha">Alterar senha</h2>
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
            <p className="fl-perfil-status" role="status">
              {sucessoSenha}
            </p>
          )}
          {mensagemSenha && (
            <p className="fl-alert" role="alert">
              {mensagemSenha}
            </p>
          )}
        </form>
      </section>
    </section>
  );
}
