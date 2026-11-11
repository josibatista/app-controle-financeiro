# Em andamento... 🔄

## 🛠️ Tecnologias e Bibliotecas Utilizadas

O projeto utilizará diferentes tecnologias e bibliotecas para o desenvolvimento do front-end, back-end e integração com o banco de dados, contemplando a construção da interface, implementação da API REST, autenticação, validação de dados e persistência das informações.

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
| Zod | Validação dos dados recebidos pela API. |
| CORS | Controle de acesso à API entre diferentes origens. |
| JSON Web Token | Geração e validação de tokens de autenticação. |
| Bcrypt | Proteção das senhas por meio de hash e salt. |
| Dotenv | Gerenciamento de variáveis de ambiente. |

### 🗄️ Banco de Dados

| Biblioteca | Função |
|---|---|
| Supabase JS | Integração entre o back-end e os serviços do Supabase.

## 🚀 Como executar o projeto

### 1. Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/)
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
npm install
```

**5.** Crie um arquivo `.env` na pasta `backend/`, utilizando o `.env.example` como referência. Configure a variável de conexão com os dados fornecidos pelo Supabase:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:SUA_SENHA@HOST.pooler.supabase.com:5432/postgres?sslmode=require
```

Substitua os valores de exemplo pelas informações do seu projeto no Supabase, incluindo a senha definida na criação. Configure também as demais variáveis indicadas no `.env.example`.


**6.** Execute o script de criação das tabelas:

```bash
node database/setup.js
```

Esse comando executa o `schema.sql`, criando as tabelas, os relacionamentos e as restrições necessárias no PostgreSQL hospedado no Supabase.

**7.** Popule o banco com os dados de demonstração:

```bash
node database/seed.js
```

O seed insere usuários fictícios, categorias, fontes/destinos e lançamentos para facilitar os testes.

**Observação:** os scripts de criação e população devem ser executados apenas durante a configuração inicial de um banco vazio. Não é necessário executá-los sempre que iniciar a aplicação.

### 3. Execução da aplicação

*As instruções de inicialização do backend e do frontend serão adicionadas conforme o desenvolvimento do projeto.*