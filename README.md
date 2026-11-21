# 💰 Economizze

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)

Economizze é uma aplicação acadêmica *full-stack* desenvolvida em React, Node.js e PostgreSQL para controle financeiro pessoal, permitindo gerenciar receitas, despesas, parcelamentos, categorias, fontes/destinos, faturas de cartões e relatórios gráficos por período.

> 📚 **Nota acadêmica:** Trabalho desenvolvido como projeto da disciplina de **Programação Web Full-Stack** do curso de Engenharia de Software da **UTFPR-CP**.

---

## 🔍 Sobre o sistema

O sistema conta com autenticação via JWT, persistência em banco de dados PostgreSQL (Supabase) e telas conectadas pela navegação principal:

| Tela / Módulo | Funcionalidades |
|---|---|
| **Cadastro — `/cadastro`** | Criação de conta validando nome, e-mail, CPF (com dígitos verificadores), senha (mínimo 8 caracteres, com letras e números) e confirmação. Grava usuário, categorias padrão e conta corrente na mesma transação. |
| **Login — `/login`** | Autenticação do usuário com geração de token JWT (validade de 1 hora, armazenado em `sessionStorage`) e bloqueio contra força bruta (limite de 10 tentativas malsucedidas por IP a cada 15 minutos). |
| **Resumo mensal — `/inicio`**| Apresenta uma visão geral das finanças do usuário, com seleção de mês e ano para consulta do total de entradas, total de saídas e saldo do período. |
| **Perfil — `/meu-perfil`** | Permite alterar nome, e-mail e senha (mediante confirmação da senha atual), exibindo o CPF apenas para consulta. |
| **Categorias — `/categorias`** | Cadastro, listagem, edição e exclusão de categorias (bloqueando a exclusão caso existam lançamentos vinculados). |
| **Fonte/Destinos — `/fontes-destinos`** | Cadastro, listagem, edição e exclusão de contas/cartões/rendas (bloqueando a exclusão caso existam lançamentos vinculados). |
| **Lançamentos — `/lancamentos`** | Listagem com filtros e paginação, criação (incluindo lançamentos parcelados), edição e exclusão individual ou por grupo de parcelas. |
| **Faturas — `/faturas`** | Consulta de faturas e limites dos cartões, com filtragem por cartão. |
| **Relatórios — `/relatorios`** | Relatórios gráficos por categoria e por fonte/destino filtrados por período. |
| **Saúde Financeira — `/saude-financeira`** | Painel de análise da situação financeira que calcula a taxa de poupança mensal, identifica categorias com gastos acima da média dos três meses anteriores, analisa o comprometimento da renda com faturas dos próximos três meses, apresenta o cronograma de parcelas futuras e estima a evolução financeira para os próximos 12 meses com base no histórico de movimentações. |

A interface das áreas autenticadas utiliza uma estrutura compartilhada, com menu lateral minimizável, barra superior com seletor de tema e adaptação para telas menores.

---

## 📁 Organização de pastas

O repositório está dividido entre as camadas de `backend` (API REST e conexão com o PostgreSQL) e `frontend` (interface web em React):

```text
app-controle-financeiro/
├── backend/
│   ├── database/
│   │   ├── schema.sql               # Script de criação das tabelas, relacionamentos e restrições
│   │   ├── seed.js                  # População inicial com dados de demonstração
│   │   └── setup.js                 # Script de execução do schema no banco de dados
│   ├── src/
│   │   ├── config/                  # Configurações do banco (db.js), JWT (jwt.js) e parâmetros de saúde financeira
│   │   ├── middlewares/             # Middlewares de autenticação (autenticar.js) e tratamento global de erros (tratarErro.js)
│   │   ├── models/                  # Modelos, consultas SQL e validações (categoria, fatura, lancamento, saudeFinanceira, etc.)
│   │   ├── routes/                  # Rotas e controladores da API REST (auth, categorias, faturas, lancamentos, relatorios, saudeFinanceira)
│   │   └── server.js                # Ponto de entrada e configuração do servidor Express
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/               # Telas principais (Inicio, Login, Cadastro, Lancamentos, Faturas, Relatorio, SaudeFinanceira, Perfil, etc.)
│   │   │   ├── relatorios/          # Componentes específicos dos gráficos por categoria e fonte/destino
│   │   │   └── ...                  # Componentes compartilhados (MenuLateral, LayoutPrincipal, RotaProtegida, SeletorTema, etc.)
│   │   ├── contexts/                # Contextos globais de autenticação (AuthContext.jsx) e tema (ThemeContext.jsx)
│   │   ├── services/                # Comunicação com a API (api.js) e regras/validações no cliente (cpf.js, validarCadastro.js, etc.)
│   │   ├── App.jsx                  # Definição das rotas e estrutura principal da aplicação
│   │   ├── main.jsx                 # Ponto de entrada do React
│   │   └── styles.css               # Estilos globais da aplicação
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js               # Configuração do Vite e proxy para a API (/api)
│
└── README.md
```

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

---

## 📡 Rotas da API

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
| GET | `/api/saude-financeira` | Consultar os indicadores de saúde financeira (taxa de poupança, gastos fora da curva, comprometimento com cartões, parcelas futuras e projeção de 12 meses). |

As respostas de erro usam `mensagem` e, quando houver erros em campos, `erros`:

```json
{
  "mensagem": "Confira os campos informados.",
  "erros": { "email": "Digite um e-mail válido." }
}
```

Os códigos usados incluem 400 para dados inválidos, 401 para acesso inválido ou expirado, 404 para registro ou rota não encontrados, 409 para duplicidade ou exclusão de registro vinculado e 429 para excesso de tentativas de login. Falhas internas retornam 500 com uma mensagem genérica. Criações retornam 201; exclusões concluídas retornam 204 sem corpo.

---

## 🔐 Autenticação e segurança

A autenticação é realizada por meio de tokens JWT, com validade de uma hora. Após o login, o token é armazenado no `sessionStorage` do navegador e enviado nas requisições às rotas protegidas por meio do cabeçalho `Authorization: Bearer <token>`.

No back-end, um middleware valida o token e identifica o usuário autenticado por meio de `req.usuarioId`, garantindo que as consultas e operações sejam associadas à conta correspondente.

As senhas são armazenadas como hashes com salt, utilizando Bcrypt, e nunca são retornadas pela API. O cadastro também verifica a duplicidade de e-mail e CPF, enquanto o login possui limitação de dez tentativas malsucedidas por IP a cada quinze minutos.

Ao encerrar a sessão, o token é removido do `sessionStorage`.

---

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
DATABASE_URL=postgresql://postgres.PROJECT_REF:SUA_SENHA@HOST.pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require
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

A conexão pode apontar para o PostgreSQL local ou para o Supabase. Em `FRONTEND_ORIGINS`, informe as origens autorizadas separadas por vírgula, sem caminhos ou barra final.


**6.** Execute o script de criação das tabelas:

```bash
npm run db:setup
```

Esse comando executa o `schema.sql`, criando as tabelas, os relacionamentos e as restrições necessárias no PostgreSQL hospedado no Supabase.

**7.** Popule o banco com os dados de demonstração (necessário para a apresentação):

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

Se o servidor informar que o `JWT_SECRET` não foi definido, confira o arquivo `backend/.env`.

---

## 👥 Organização da equipe

| Integrante | Responsabilidades |
|---|---|
| **Josiane Batista** | Modelagem e configuração do banco de dados PostgreSQL/Supabase (incluindo scripts `schema.sql`, `setup.js` e população de dados em `seed.js`); desenvolvimento *full-stack* dos módulos de categorias, fontes/destinos e faturas; e desenvolvimento do front-end das telas de lançamentos e saúde financeira. |
| **Letícia Bento** | Identidade visual e padronização de estilos da aplicação; desenvolvimento *full-stack* (front-end e back-end) de toda a parte de usuário, incluindo cadastro, login, perfil, validações, autenticação via JWT e *middlewares*. |
| **Pamela Berti** | Desenvolvimento *full-stack* (front-end e back-end) dos relatórios gráficos (por categoria e por fonte/destino) e implementação da lógica e das rotas de back-end dos módulos de lançamentos e saúde financeira. |

