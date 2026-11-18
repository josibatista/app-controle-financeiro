import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Campo from '../Campo.jsx';
import {
  tiposFonteDestino,
  listarFontesDestinos,
  criarFonteDestino,
  atualizarFonteDestino,
  excluirFonteDestino,
  novoFormulario,
  formularioDoItem,
  validarFonteDestino,
  dadosParaAPI,
  formatarLimite,
} from '../../services/fontesDestinos.js';
import './FontesDestinos.css';

const campos = {
  nome: {
    label: 'Nome',
    maxLength: 60,
  },
  dia_fechamento: {
    label: 'Dia de fechamento',
    type: 'number',
    min: 1,
    max: 31,
    step: 1,
  },
  dia_vencimento: {
    label: 'Dia de vencimento',
    type: 'number',
    min: 1,
    max: 31,
    step: 1,
  },
  limite: {
    label: 'Limite (R$)',
    inputMode: 'decimal'
  },
};

function IconeAcao({ nome }) {
  const caminhos = {
    editar: 'm15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z',
    excluir: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    salvar: 'm5 12 4 4L19 6',
    cancelar: 'm6 6 12 12M18 6 6 18',
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
      <path d={caminhos[nome]} />
    </svg>
  );
}

function CampoFonte({
  nome,
  dados,
  onChange,
  erros,
  contexto,
  disabled,
  form,
  permitirCartao = false,
}) {
  const id = `${contexto}-${nome}`;

  if (nome === 'tipo') {
    return (
      <div className="fl-field">
        <label htmlFor={id}>Tipo *</label>

        <select
          id={id}
          name="tipo"
          className="fl-input"
          value={dados.tipo}
          onChange={onChange}
          disabled={disabled}
          form={form}
          aria-invalid={Boolean(erros.tipo)}
          aria-describedby={erros.tipo ? `${id}-erro` : undefined}
          required
        >
          <option value="renda">Renda</option>
          <option value="conta">Conta</option>

          {permitirCartao && (
            <option value="cartao_credito">
              Cartão de crédito
            </option>
          )}
        </select>

        {erros.tipo && (
          <p
            id={`${id}-erro`}
            className="fl-field-error"
            role="alert"
          >
            {erros.tipo}
          </p>
        )}
      </div>
    );
  }

  return (
    <Campo
      {...campos[nome]}
      id={id}
      name={nome}
      value={dados[nome]}
      onChange={onChange}
      erro={erros[nome]}
      disabled={disabled}
      form={form}
      marcarObrigatorio
      required
    />
  );
}

export default function FontesDestinos() {
  const navigate = useNavigate();

  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  const [edicao, setEdicao] = useState(null);
  const [errosEdicao, setErrosEdicao] = useState({});

  const [modal, setModal] = useState(null);
  const [novo, setNovo] = useState(novoFormulario);
  const [errosNovo, setErrosNovo] = useState({});
  const [alvo, setAlvo] = useState(null);

  const [erroPagina, setErroPagina] = useState('');
  const [erroModal, setErroModal] = useState('');
  const [mensagem, setMensagem] = useState('');

  const dialogRef = useRef(null);
  const linhaRef = useRef(null);

  const idEditando = edicao?.id ?? null;

  useEffect(() => {
    document.title = 'Fontes e Destinos';
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setCarregando(true);
    setErroPagina('');

    listarFontesDestinos(controller.signal)
      .then(setItens)
      .catch((erro) => {
        if (controller.signal.aborted) return;

        if (erro.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setErroPagina(erro.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      });

    return () => controller.abort();
  }, [navigate, tentativa]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (modal && !dialog.open) {
      dialog.showModal();
    }

    if (!modal && dialog.open) {
      dialog.close();
    }
  }, [modal]);

  useEffect(() => {
    if (idEditando !== null) {
      linhaRef.current?.querySelector('input')?.focus();
    }
  }, [idEditando]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    return itens
      .filter((item) =>
        item.nome.toLocaleLowerCase('pt-BR').includes(termo)
      )
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR') || a.id - b.id
      );
  }, [itens, busca]);

  function tratarErro(erro, destino) {
    if (erro.status === 401) {
      navigate('/login', { replace: true });
    } else {
      destino(erro.message);
    }
  }

  function abrirCadastro() {
    setNovo(novoFormulario());
    setErrosNovo({});
    setErroModal('');
    setMensagem('');
    setModal('novo');
  }

  function abrirExclusao(item) {
    setAlvo(item);
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

  function iniciarEdicao(item) {
    setEdicao({
      id: item.id,
      dados: formularioDoItem(item),
    });

    setErrosEdicao({});
    setErroPagina('');
    setMensagem('');
  }

  function cancelarEdicao() {
    setEdicao(null);
    setErrosEdicao({});
    setErroPagina('');
  }

  function alterarEdicao(event) {
    const { name, value } = event.target;

    setEdicao((atual) => ({
      ...atual,
      dados: {
        ...atual.dados,
        [name]: value,
      },
    }));

    setErrosEdicao({});
    setErroPagina('');
  }

  function alterarNovo(event) {
    const { name, value } = event.target;

    setNovo((atual) => ({
      ...atual,
      [name]: value,
    }));

    setErrosNovo({});
    setErroModal('');
  }

  async function salvar(event, editando) {
    event.preventDefault();

    if (ocupado || (editando && !edicao)) return;

    const dados = editando ? edicao.dados : novo;
    const setErros = editando ? setErrosEdicao : setErrosNovo;
    const setMensagemErro = editando
      ? setErroPagina
      : setErroModal;

    const erros = validarFonteDestino(dados);

    setErros(erros);
    setMensagemErro('');

    const primeiro = Object.keys(erros)[0];

    if (primeiro) {
      event.currentTarget.elements.namedItem(primeiro)?.focus();
      return;
    }

    setOcupado(true);

    try {
      const payload = dadosParaAPI(dados);

      const resultado = editando
        ? await atualizarFonteDestino(edicao.id, payload)
        : await criarFonteDestino(payload);

      setItens((atuais) =>
        editando
          ? atuais.map((item) =>
              item.id === resultado.id ? resultado : item
            )
          : [...atuais, resultado]
      );

      if (editando) {
        setEdicao(null);
      } else {
        setModal(null);
        setBusca('');
      }

      setMensagem(
        editando
          ? 'Registro atualizado.'
          : 'Registro cadastrado.'
      );
    } catch (erro) {
      setErros(erro.erros ?? {});
      tratarErro(erro, setMensagemErro);
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarExclusao() {
    if (ocupado || !alvo) return;

    setOcupado(true);
    setErroModal('');

    try {
      await excluirFonteDestino(alvo.id);

      setItens((atuais) =>
        atuais.filter((item) => item.id !== alvo.id)
      );

      setModal(null);
      setAlvo(null);
      setMensagem('Registro excluído.');
    } catch (erro) {
      tratarErro(erro, setErroModal);
    } finally {
      setOcupado(false);
    }
  }

  function renderTabela(cartao) {
    const registros = filtrados.filter((item) =>
      cartao
        ? item.tipo === 'cartao_credito'
        : item.tipo !== 'cartao_credito'
    );

    const colunas = cartao
      ? ['nome', 'dia_fechamento', 'dia_vencimento', 'limite']
      : ['nome', 'tipo'];

    const titulos = {
      nome: 'Nome',
      tipo: 'Tipo',
      dia_fechamento: 'Dia de fechamento',
      dia_vencimento: 'Dia de vencimento',
      limite: 'Limite',
    };

    return (
      <div className="fd-tabela-wrap">
        <table
          className={`fd-tabela${cartao ? ' fd-tabela--cartoes' : ''}`}
        >
          <caption className="fd-sr-only">
            {cartao ? 'Cartões de crédito' : 'Rendas e contas'}
          </caption>

          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th scope="col" key={coluna}>
                  {titulos[coluna]}
                </th>
              ))}

              <th scope="col">Ações</th>
            </tr>
          </thead>

          <tbody>
            {registros.map((item) => {
              const editando = idEditando === item.id;
              const inativo =
                idEditando !== null && !editando;

              return (
                <tr
                  key={item.id}
                  ref={editando ? linhaRef : null}
                  className={
                    editando
                      ? 'fd-linha--editando'
                      : inativo
                        ? 'fd-linha--inativa'
                        : ''
                  }
                >
                  {colunas.map((coluna) => (
                    <td key={coluna}>
                      {editando ? (
                        <CampoFonte
                          nome={coluna}
                          dados={edicao.dados}
                          onChange={alterarEdicao}
                          erros={errosEdicao}
                          contexto={`edicao-${item.id}`}
                          disabled={ocupado}
                          form="fd-edicao"
                        />
                      ) : coluna === 'tipo'
                        ? tiposFonteDestino[item.tipo]
                        : coluna === 'limite'
                          ? formatarLimite(item.limite)
                          : item[coluna]}
                    </td>
                  ))}

                  <td>
                    <div
                      className="fd-acoes"
                      key={editando ? 'edicao' : 'visualizacao'}
                    >
                      {editando ? (
                        <>
                          <button
                            type="submit"
                            form="fd-edicao"
                            className="fd-acao"
                            disabled={ocupado}
                          >
                            <IconeAcao nome="salvar" />
                            <span>
                              {ocupado ? 'Salvando...' : 'Salvar'}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="fd-acao"
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
                            className="fd-acao"
                            aria-label={`Editar ${item.nome}`}
                            disabled={inativo || ocupado}
                            onClick={(event) => {
                              event.preventDefault();
                              iniciarEdicao(item);
                            }}
                          >
                            <IconeAcao nome="editar" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            className="fd-acao fd-perigo"
                            aria-label={`Excluir ${item.nome}`}
                            disabled={inativo || ocupado}
                            onClick={() => abrirExclusao(item)}
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

            {registros.length === 0 && (
              <tr>
                <td
                  colSpan={colunas.length + 1}
                  className="fd-vazio"
                >
                  {carregando
                    ? 'Carregando...'
                    : erroPagina && itens.length === 0
                      ? 'Não foi possível carregar a lista.'
                      : 'Nenhum registro encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="fl-page fd-page">

      <main className="fd-main">
        <div className="fd-topo">
          <div>
            <h1 className="fl-heading">Fontes e Destinos</h1>

            <p className="fl-description">
              Gerencie suas rendas, contas e cartões de crédito.
            </p>
          </div>

          <button
            type="button"
            className="fd-botao fd-botao--principal"
            onClick={abrirCadastro}
            disabled={
              idEditando !== null || ocupado || carregando
            }
          >
            <span aria-hidden="true">＋</span>
            Adicionar
          </button>
        </div>

        <div className="fd-busca">
          <Campo
            id="fd-busca"
            label="Buscar por nome nas duas seções"
            type="search"
            placeholder="Pesquisar fonte, conta ou cartão"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            disabled={idEditando !== null || ocupado}
          />
        </div>

        {idEditando !== null && (
          <p className="fd-orientacao">
            Salve ou cancele a edição para acessar os outros registros.
          </p>
        )}

        {mensagem && (
          <p className="fd-status" role="status">
            {mensagem}
          </p>
        )}

        {erroPagina && (
          <div className="fd-erro" role="alert">
            <p>{erroPagina}</p>

            {idEditando === null && (
              <button
                type="button"
                className="fl-text-button"
                onClick={() =>
                  setTentativa((valor) => valor + 1)
                }
                disabled={carregando || ocupado}
              >
                Atualizar lista
              </button>
            )}
          </div>
        )}

        <form
          id="fd-edicao"
          onSubmit={(event) => salvar(event, true)}
          noValidate
        />

        <section
          className="fd-secao"
          aria-labelledby="fd-rendas-titulo"
        >
          <div className="fd-secao-topo">
            <h2 id="fd-rendas-titulo">Rendas e contas</h2>
          </div>

          {renderTabela(false)}
        </section>

        <section
          className="fd-secao"
          aria-labelledby="fd-cartoes-titulo"
        >
          <div className="fd-secao-topo">
            <h2 id="fd-cartoes-titulo">Cartões de crédito</h2>
          </div>

          {renderTabela(true)}
        </section>
      </main>

      <dialog
        ref={dialogRef}
        className="fd-modal"
        aria-labelledby="fd-modal-titulo"
        onCancel={(event) => {
          event.preventDefault();
          fecharModal();
        }}
      >
        <h2 id="fd-modal-titulo">
          {modal === 'excluir'
            ? 'Excluir registro'
            : 'Novo fonte/destino'}
        </h2>

        {modal === 'novo' && (
          <form
            onSubmit={(event) => salvar(event, false)}
            noValidate
          >
            {(novo.tipo === 'cartao_credito'
              ? [
                  'nome',
                  'tipo',
                  'dia_fechamento',
                  'dia_vencimento',
                  'limite',
                ]
              : ['nome', 'tipo']
            ).map((nome) => (
              <CampoFonte
                key={nome}
                nome={nome}
                dados={novo}
                onChange={alterarNovo}
                erros={errosNovo}
                contexto="novo"
                disabled={ocupado}
                permitirCartao
              />
            ))}

            {novo.tipo === 'cartao_credito' && (
              <p className="fl-help">
                Digite o limite sem separador de milhar, por exemplo: 3000,00.
              </p>
            )}

            {erroModal && (
              <p className="fd-erro" role="alert">
                {erroModal}
              </p>
            )}

            <div className="fd-modal-acoes">
              <button
                type="button"
                className="fd-botao"
                onClick={fecharModal}
                disabled={ocupado}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="fd-botao fd-botao--principal"
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
              Confirma a exclusão de{' '}
              <strong>{alvo.nome}</strong>?
            </p>

            {erroModal && (
              <p className="fd-erro" role="alert">
                {erroModal}
              </p>
            )}

            <div className="fd-modal-acoes">
              <button
                type="button"
                className="fd-botao"
                onClick={fecharModal}
                disabled={ocupado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="fd-botao fd-perigo"
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