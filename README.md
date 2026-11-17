# Em andamento... 🔄

## 🛠️ Tecnologias e Bibliotecas Utilizadas

O projeto utiliza diferentes tecnologias e bibliotecas para o desenvolvimento do front-end, back-end e integração com o banco de dados, contemplando a construção da interface, implementação da API REST, autenticação, validação de dados e persistência das informações.

### 💻 Tecnologias

| Tecnologia | Função |
|---|---|
| JavaScript | Linguagem utilizada no desenvolvimento da aplicação. |
| HTML5 | Estruturação das páginas. |
| CSS3 | Estilização da interface. |
| Node.js | Ambiente de execução JavaScript no back-end. |
| Vite | Ferramenta de desenvolvimento e compilação do front-end. |
| Supabase | Plataforma de gerenciamento do banco de dados PostgreSQL. |

### 🎨 Front-end

| Biblioteca | Função |
|---|---|
| React | Construção da interface por meio de componentes. |
| React Router DOM | Gerenciamento da navegação entre páginas. |
| Recharts | Criação de gráficos para os relatórios financeiros. |

### ⚙️ Back-end

| Biblioteca | Função |
|---|---|
| Express | Criação do servidor e gerenciamento das rotas da API REST. |
| Express Rate Limit | Limitação da quantidade de requisições. |
| CORS | Controle de acesso à API entre diferentes origens. |
| JSON Web Token | Geração e validação de tokens de autenticação. |
| Bcrypt | Proteção das senhas por meio de hash e salt. |
| Dotenv | Gerenciamento de variáveis de ambiente. |

### 🗄️ Banco de Dados

| Biblioteca | Função |
|---|---|
| pg (node-postgres) | Conexão com o PostgreSQL e execução de consultas parametrizadas. |

## 🚀 Como executar o projeto

### 1. Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) 22.12 ou superior
- [Git](https://git-scm.com/)

O projeto utiliza PostgreSQL hospedado no [Supabase](https://supabase.com/), dispensando sua instalação local.

### 2. Configuração do banco de dados

O projeto utiliza PostgreSQL, hospedado no Supabase, com acesso por meio da biblioteca `pg` (node-postgres).

**1.** Acesse o [Supabase](https://supabase.com/dashboard), crie uma conta gratuita e selecione **New Project**.

**2.** Configure o projeto, definindo um nome, uma senha para o banco de dados e uma região. Após a criação, acesse **Connect → Connection string** e selecione o método **Session pooler**.

**3.** Acesse a pasta do backend:

```bash
cd backend
```

**4.** Instale as dependências:

```bash
npm ci
```

**5.** Crie um arquivo `.env` na pasta `backend/`, utilizando o `.env.example` como referência. Configure a variável de conexão com os dados fornecidos pelo Supabase:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:SUA_SENHA@HOST.pooler.supabase.com:5432/postgres?sslmode=require
```

Substitua os valores de exemplo pelas informações do seu projeto no Supabase, incluindo a senha definida na criação. Configure também as demais variáveis indicadas no `.env.example`. Se já existir um `.env`, preserve a conexão do grupo e acrescente somente o que estiver faltando.

Gere um segredo para assinar os tokens:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado em `JWT_SECRET` no `backend/.env`. O segredo precisa ter pelo menos 32 caracteres e não deve ser publicado no GitHub. Um exemplo de configuração, sem credenciais reais:

```dotenv
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/controle_financeiro
JWT_SECRET=
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

A conexão pode apontar para o PostgreSQL local ou para o Supabase. Em `FRONTEND_ORIGINS`, informe as origens autorizadas separadas por vírgula, sem caminhos ou barra final. No Codespaces, a origem exata da porta 5173 é incluída automaticamente quando `CODESPACE_NAME` está disponível; se necessário, informe a URL da porta em `FRONTEND_ORIGINS`.


**6.** Execute o script de criação das tabelas:

```bash
npm run db:setup
```

Esse comando executa o `schema.sql`, criando as tabelas, os relacionamentos e as restrições necessárias no PostgreSQL hospedado no Supabase.

**7.** Opcionalmente, popule um banco de desenvolvimento com os dados de demonstração:

```bash
node database/seed.js
```

O seed insere usuários fictícios, categorias, fontes/destinos e lançamentos para facilitar os testes.

**Observação:** os scripts de criação e população devem ser executados apenas durante a configuração inicial de um banco vazio. Não é necessário executá-los sempre que iniciar a aplicação.

### 3. Execução da aplicação

#### 3.1. Front-end

O front-end foi desenvolvido com React e Vite.

**1.** A partir da raiz do projeto, acesse a pasta do frontend:

```bash
cd frontend
```

**2.** Instale as dependências:

```bash
npm ci
```

**3.** Inicie o servidor de desenvolvimento:

```bash
npm run dev -- --host 0.0.0.0
```

**4.** Acesse a aplicação pelo navegador:

http://localhost:5173

O Vite informará no terminal o endereço local disponível para acesso. No Codespaces, abra a aba **Ports** e use **Open in Browser** na porta 5173. O backend também precisa estar rodando: as chamadas `/api` são encaminhadas pelo Vite para `http://127.0.0.1:3000`.

Para gerar a versão de produção do frontend, execute:

```bash
npm run build
```

#### 3.2. Back-end

Em outro terminal, a partir da raiz do repositório:

```bash
cd backend
npm ci
npm run dev
```

O servidor usa a porta 3000 por padrão. O comando `npm start` inicia a API sem o modo de observação. Deixe o terminal do backend aberto e execute o frontend em um segundo terminal.

Se o servidor informar que o segredo JWT está ausente ou é curto demais, confira `backend/.env`. A variável `NODE_ENV=test` é usada somente nos testes; ela impede que o arquivo `server.js` abra a porta automaticamente. A função `criarApp` permanece nesse arquivo.

## Autenticação e telas

Abra `/cadastro` para criar uma conta e `/login` para entrar. O cadastro valida nome, e-mail, CPF com dígitos verificadores, senha e confirmação. A senha precisa ter no mínimo oito caracteres, com letras e números. O limite de 72 bytes evita o truncamento feito pelo bcrypt.

O cadastro grava o usuário, as categorias padrão e a conta corrente na mesma transação. E-mail ou CPF duplicado retorna 409, com o erro no campo correspondente. As senhas ficam armazenadas como hash com salt e não são devolvidas pela API.

O token JWT dura uma hora. As rotas privadas validam esse token e usam `req.usuarioId` para consultar os dados da conta. O navegador guarda o token em `sessionStorage` e o remove ao sair. O login limita as tentativas malsucedidas a dez por IP em quinze minutos.

O dashboard consulta o resumo do mês no backend. No perfil, o usuário altera nome, e-mail e senha com as mesmas regras do cadastro; o CPF aparece apenas para consulta. Para trocar a senha, é preciso informar a senha atual.

O grupo fará o desafio de saúde financeira em uma etapa posterior. Por enquanto, o menu e a rota `/saude-financeira` indicam **Em breve**; ainda não há cálculo nem API desse desafio.

## Rotas da API

As rotas de autenticação e perfil ficam em `/api/auth`. Cadastro e login são públicos. Todas as demais rotas da tabela exigem `Authorization: Bearer <token>`.

| Método | Rota | Função |
|---|---|---|
| POST | `/api/auth/cadastro` | Criar usuário com os dados padrão. |
| POST | `/api/auth/login` | Autenticar e devolver o token. |
| GET | `/api/auth/me` | Consultar os dados básicos do usuário e a expiração da sessão. |
| GET | `/api/auth/perfil` | Consultar nome, e-mail e CPF do usuário. |
| PUT | `/api/auth/perfil` | Atualizar nome e e-mail. |
| PUT | `/api/auth/senha` | Alterar a senha, informando a senha atual. |
| GET | `/api/categorias` | Listar categorias da conta. |
| POST | `/api/categorias` | Criar categoria. |
| PUT | `/api/categorias/:id` | Atualizar categoria. |
| DELETE | `/api/categorias/:id` | Excluir categoria sem lançamentos vinculados. |
| GET | `/api/fontes-destinos` | Listar fontes e destinos da conta. |
| POST | `/api/fontes-destinos` | Criar fonte ou destino. |
| PUT | `/api/fontes-destinos/:id` | Atualizar fonte ou destino. |
| DELETE | `/api/fontes-destinos/:id` | Excluir fonte ou destino sem lançamentos vinculados. |
| GET | `/api/lancamentos` | Listar lançamentos com filtros e paginação. |
| GET | `/api/lancamentos/resumo` | Consultar os totais do período. |
| GET | `/api/lancamentos/:id` | Consultar um lançamento da conta. |
| POST | `/api/lancamentos` | Criar lançamento, incluindo parcelamento quando informado. |
| PUT | `/api/lancamentos/:id` | Atualizar lançamento. |
| DELETE | `/api/lancamentos/:id` | Excluir lançamento. |
| DELETE | `/api/lancamentos/grupo/:grupoParcelamento` | Excluir um grupo de parcelas. |
| GET | `/api/faturas` | Consultar faturas e limites dos cartões. |
| GET | `/api/relatorios/categorias?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Consultar relatório por categoria. |
| GET | `/api/relatorios/fontes-destinos?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Consultar relatório por fonte e destino. |

As respostas de erro usam `mensagem` e, quando houver erros em campos, `erros`:

```json
{
  "mensagem": "Confira os campos informados.",
  "erros": { "email": "Digite um e-mail válido." }
}
```

Os códigos usados incluem 400 para dados inválidos, 401 para acesso inválido ou expirado, 403 para origem não autorizada, 404 para registro ou rota não encontrados, 409 para duplicidade ou exclusão de registro vinculado, 413 para corpo muito grande e 429 para excesso de tentativas de login. Falhas internas retornam 500 com uma mensagem genérica. Criações retornam 201; exclusões concluídas retornam 204 sem corpo.

## Organização

Em `backend/src/`, `server.js` monta e inicia a aplicação. As únicas subpastas são `routes/`, `models/`, `middlewares/` e `config/`. Os controladores ficam nos próprios arquivos de rotas. As validações puras de usuário, incluindo CPF, ficam em `models/validarUsuario.js`.

No frontend, as telas ficam em `src/components/pages/`, os componentes compartilhados em `src/components/`, os contextos em `src/contexts/` e os clientes da API e utilitários em `src/services/`.

## Testes opcionais

Na pasta `backend`, execute `npm test` para conferir as validações. Para executar também os testes de integração, defina `TEST_DATABASE_URL` com uma conexão PostgreSQL de testes antes do comando. Os testes criam e removem um schema isolado, sem usar as tabelas do schema público. A conexão precisa permitir criar e remover schemas.

Se `TEST_DATABASE_URL` não estiver definida, o teste de integração é indicado como ignorado. A variável `NODE_ENV=test` é definida pelo arquivo de testes para importar `criarApp` sem iniciar o servidor automaticamente. Os testes não são necessários para iniciar a aplicação.
