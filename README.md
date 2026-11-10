# Em andamento... 🔄


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
cd back-end
```

**4.** Instale as dependências:

```bash
npm install
```

**5.** Crie um arquivo `.env` na pasta `back-end/`, utilizando o `.env.example` como referência. Configure a variável de conexão com os dados fornecidos pelo Supabase:

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