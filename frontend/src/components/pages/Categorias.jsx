import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Campo from '../Campo.jsx';
import SeletorTema from '../SeletorTema.jsx';
import {
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
  validarCategoria,
} from '../../services/categorias.js';
import './Categorias.css';

const formularioVazio = () => ({ nome: '', tipo: '' });

function IconeAcao({ nome }) {
  const caminhos = {
    editar: (
      <>
        <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z" />
        <path d="M12 20h8" />
      </>
    ),
    excluir: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15" />
        <path d="M10 10v7M14 10v7" />
      </>
    ),
    salvar: <path d="m5 12 4 4L19 6" />,
    cancelar: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {caminhos[nome]}
    </svg>
  );
}

function TipoCampo({ id, value, onChange, erro, disabled, form }) {
  return (
    <div className="fl-field">
      <label htmlFor={id}>Tipo *</label>

      <select
        id={id}
        name="tipo"
        className="fl-input"
        value={value}
        onChange={onChange}
        disabled={disabled}
        form={form}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        required
      >
        <option value="">Selecione</option>
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
      </select>

      {erro && (
        <p id={`${id}-erro`} className="fl-field-error" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export default function Categorias() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);

  const [editando, setEditando] = useState(null);
  const [edicao, setEdicao] = useState(formularioVazio);
  const [errosEdicao, setErrosEdicao] = useState({});

  const [modal, setModal] = useState(null);
  const [alvo, setAlvo] = useState(null);
  const [novo, setNovo] = useState(formularioVazio);
  const [errosNovo, setErrosNovo] = useState({});

  const [ocupado, setOcupado] = useState(false);
  const [erroPagina, setErroPagina] = useState('');
  const [erroModal, setErroModal] = useState('');
  const [mensagem, setMensagem] = useState('');

  const dialogRef = useRef(null);
  const linhaRef = useRef(null);

  useEffect(() => {
    document.title = 'Categorias';
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setCarregando(true);
    setErroPagina('');

    listarCategorias(controller.signal)
      .then(setCategorias)
      .catch((erro) => {
        if (controller.signal.aborted) return;

        if (erro.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setErroPagina(erro.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, [navigate, tentativa]);

  useEffect(() => {
    if (modal && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }

    if (!modal && dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [modal]);

  useEffect(() => {
    if (editando !== null) {
      linhaRef.current?.querySelector('input')?.focus();
    }
  }, [editando]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    return categorias
      .filter((categoria) =>
        categoria.nome.toLocaleLowerCase('pt-BR').includes(termo)
      )
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR') || a.id - b.id
      );
  }, [categorias, busca]);

  function tratarErro(erro, destino) {
    if (erro.status === 401) {
      navigate('/login', { replace: true });
      return;
    }

    destino(erro.message);
  }

  function abrirCadastro() {
    setNovo(formularioVazio());
    setErrosNovo({});
    setErroModal('');
    setMensagem('');
    setModal('criar');
  }

  function abrirExclusao(categoria) {
    setAlvo(categoria);
    setErroModal('');
    setMensagem('');
    setModal('excluir');
  }

  function fecharModal() {
    if (ocupado) return;
    setModal(null);
    setAlvo(null);
    setErroModal('');
  }

  function iniciarEdicao(categoria) {
    setEditando(categoria.id);
    setEdicao({ nome: categoria.nome, tipo: categoria.tipo });
    setErrosEdicao({});
    setErroPagina('');
    setMensagem('');
  }

  function cancelarEdicao() {
    setEditando(null);
    setErrosEdicao({});
    setErroPagina('');
  }

  async function cadastrar(event) {
    event.preventDefault();
    if (ocupado) return;

    const erros = validarCategoria(novo);
    setErrosNovo(erros);

    const primeiro = Object.keys(erros)[0];

    if (primeiro) {
      event.currentTarget.elements.namedItem(primeiro)?.focus();
      return;
    }

    setOcupado(true);
    setErroModal('');

    try {
      const criada = await criarCategoria({
        ...novo,
        nome: novo.nome.trim(),
      });

      setCategorias((atuais) => [...atuais, criada]);
      setBusca('');
      setModal(null);
      setMensagem('Categoria cadastrada.');
    } catch (erro) {
      setErrosNovo(erro.erros ?? {});
      tratarErro(erro, setErroModal);
    } finally {
      setOcupado(false);
    }
  }

  async function salvarEdicao(event) {
    event.preventDefault();
    if (ocupado || editando === null) return;

    const erros = validarCategoria(edicao);
    setErrosEdicao(erros);

    const primeiro = Object.keys(erros)[0];

    if (primeiro) {
      event.currentTarget.elements.namedItem(primeiro)?.focus();
      return;
    }

    setOcupado(true);
    setErroPagina('');

    try {
      const atualizada = await atualizarCategoria(editando, {
        ...edicao,
        nome: edicao.nome.trim(),
      });

      setCategorias((atuais) =>
        atuais.map((item) =>
          item.id === atualizada.id ? atualizada : item
        )
      );
      setEditando(null);
      setMensagem('Categoria atualizada.');
    } catch (erro) {
      setErrosEdicao(erro.erros ?? {});
      tratarErro(erro, setErroPagina);
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarExclusao() {
    if (ocupado || !alvo) return;

    setOcupado(true);
    setErroModal('');

    try {
      await excluirCategoria(alvo.id);

      setCategorias((atuais) =>
        atuais.filter((item) => item.id !== alvo.id)
      );
      setModal(null);
      setAlvo(null);
      setMensagem('Categoria excluída.');
    } catch (erro) {
      tratarErro(erro, setErroModal);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="fl-page cat-page">
      <header className="fl-header">
        <span>Controle financeiro</span>
        <SeletorTema />
      </header>

      <main className="cat-main">
        <div className="cat-topo">
          <div>
            <h1 className="fl-heading">Categorias</h1>
            <p className="fl-description">
              Organize as categorias das suas entradas e saídas.
            </p>
          </div>

          <button
            type="button"
            className="cat-botao cat-botao--principal"
            onClick={abrirCadastro}
            disabled={editando !== null || ocupado || carregando}
          >
            <span aria-hidden="true">＋</span> Adicionar
          </button>
        </div>

        <div className="cat-busca">
          <Campo
            id="categoria-busca"
            label="Buscar por nome"
            type="search"
            placeholder="Pesquisar categoria"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            disabled={editando !== null || ocupado}
          />
        </div>

        {editando !== null && (
          <p className="cat-orientacao">
            Salve ou cancele a edição para acessar as outras categorias.
          </p>
        )}

        {mensagem && (<p className="cat-status" role="status"> {mensagem}</p>)}

        {erroPagina && (
          <div className="cat-erro" role="alert">
            <p>{erroPagina}</p>

            {editando === null && (
              <button
                type="button"
                className="fl-text-button"
                onClick={() => setTentativa((valor) => valor + 1)}
                disabled={carregando}
              >
                Atualizar lista
              </button>
            )}
          </div>
        )}

        {/* Os campos na tabela são associados a este formulário. */}
        <form
          id="categoria-edicao"
          onSubmit={salvarEdicao}
          noValidate
        />

        <div className="cat-tabela-wrap" aria-busy={carregando}>
          <table className="cat-tabela">
            <caption className="cat-sr-only">
              Categorias do usuário autenticado
            </caption>

            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tipo</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtradas.map((categoria) => {
                const estaEditando = editando === categoria.id;
                const outraEmEdicao =
                  editando !== null && !estaEditando;

                return (
                  <tr
                    key={categoria.id}
                    ref={estaEditando ? linhaRef : null}
                    className={
                      estaEditando
                        ? 'cat-linha--editando'
                        : outraEmEdicao
                          ? 'cat-linha--inativa'
                          : ''
                    }
                  >
                    <td>
                      {estaEditando ? (
                        <Campo
                          id={`categoria-nome-${categoria.id}`}
                          name="nome"
                          label="Nome"
                          value={edicao.nome}
                          maxLength={60}
                          onChange={(event) => {
                            setEdicao((atual) => ({
                              ...atual,
                              nome: event.target.value,
                            }));
                            setErrosEdicao({});
                            setErroPagina('');
                          }}
                          erro={errosEdicao.nome}
                          form="categoria-edicao"
                          disabled={ocupado}
                          required
                        />
                      ) : categoria.nome}
                    </td>

                    <td>
                      {estaEditando ? (
                        <TipoCampo
                          id={`categoria-tipo-${categoria.id}`}
                          value={edicao.tipo}
                          onChange={(event) => {
                            setEdicao((atual) => ({
                              ...atual,
                              tipo: event.target.value,
                            }));
                            setErrosEdicao({});
                            setErroPagina('');
                          }}
                          erro={errosEdicao.tipo}
                          form="categoria-edicao"
                          disabled={ocupado}
                        />
                      ) : categoria.tipo === 'entrada'
                        ? 'Entrada'
                        : 'Saída'}
                    </td>

                    <td>
                      <div className="cat-acoes" key={estaEditando ? 'edicao' : 'visualizacao'}>
                        {estaEditando ? (
                          <>
                            <button
                              type="submit"
                              form="categoria-edicao"
                              className="cat-acao"
                              disabled={ocupado}
                            >
                              <IconeAcao nome="salvar" />
                              <span>{ocupado ? 'Salvando...' : 'Salvar'}</span>
                            </button>

                            <button
                              type="button"
                              className="cat-acao"
                              onClick={cancelarEdicao}
                              disabled={ocupado}
                            >
                              <IconeAcao nome="cancelar" />
                              <span>Cancelar</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="cat-acao"
                              aria-label={`Editar categoria ${categoria.nome}`}
                              onClick={(event) => { event.preventDefault(); iniciarEdicao(categoria); }}
                              disabled={outraEmEdicao || ocupado}
                            >
                              <IconeAcao nome="editar" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              className="cat-acao cat-acao--perigo"
                              aria-label={`Excluir categoria ${categoria.nome}`}
                              onClick={() => abrirExclusao(categoria)}
                              disabled={outraEmEdicao || ocupado}
                            >
                              <IconeAcao nome="excluir" />
                              <span>Excluir</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={3} className="cat-vazio">
                    {carregando
                      ? 'Carregando categorias...'
                      : erroPagina
                        ? 'Não foi possível carregar a lista.'
                        : 'Nenhuma categoria encontrada.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <dialog
        ref={dialogRef}
        className="cat-modal"
        aria-labelledby="categoria-modal-titulo"
        onCancel={(event) => {
          event.preventDefault();
          fecharModal();
        }}
      >
        <h2 id="categoria-modal-titulo">
          {modal === 'criar' ? 'Nova categoria' : 'Excluir categoria'}
        </h2>

        {modal === 'criar' && (
          <form onSubmit={cadastrar} noValidate>
            <Campo
              id="categoria-novo-nome"
              name="nome"
              label="Nome"
              maxLength={60}
              value={novo.nome}
              onChange={(event) => {
                setNovo((atual) => ({
                  ...atual,
                  nome: event.target.value,
                }));
                setErrosNovo({});
                setErroModal('');
              }}
              erro={errosNovo.nome}
              disabled={ocupado}
              marcarObrigatorio
              required
            />

            <TipoCampo
              id="categoria-novo-tipo"
              value={novo.tipo}
              onChange={(event) => {
                setNovo((atual) => ({
                  ...atual,
                  tipo: event.target.value,
                }));
                setErrosNovo({});
                setErroModal('');
              }}
              erro={errosNovo.tipo}
              disabled={ocupado}
            />

            {erroModal && (
              <p className="cat-erro" role="alert">{erroModal}</p>
            )}

            <div className="cat-modal-acoes">
              <button
                type="button"
                className="cat-botao"
                onClick={fecharModal}
                disabled={ocupado}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="cat-botao cat-botao--principal"
                disabled={ocupado}
              >
                {ocupado ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {modal === 'excluir' && alvo && (
          <>
            <p>
              Confirma a exclusão da categoria{' '}
              <strong>{alvo.nome}</strong>?
            </p>

            {erroModal && (
              <p className="cat-erro" role="alert">{erroModal}</p>
            )}

            <div className="cat-modal-acoes">
              <button
                type="button"
                className="cat-botao"
                onClick={fecharModal}
                disabled={ocupado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="cat-botao cat-botao--perigo"
                onClick={confirmarExclusao}
                disabled={ocupado}
              >
                {ocupado ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}