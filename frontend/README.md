# Front-end: acesso à conta

Esta etapa contém as telas de login e cadastro, com os temas claro e escuro. A escolha de tema fica salva no navegador quando o armazenamento está disponível. Nome e logo ainda serão definidos pelo grupo.

## Executar

Use Node.js 22.12 ou superior. Na pasta `frontend`:

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Abra `http://localhost:5173/login` ou `http://localhost:5173/cadastro`. No Codespaces, use a opção **Open in Browser** da porta 5173. Para gerar o build:

```bash
npm run build
```

## Cadastro

O formulário segue os campos do RF1: nome, e-mail, CPF, senha e confirmação de senha. Todos são obrigatórios e estão marcados com asterisco. As ajudas de e-mail, CPF e senha abrem por mouse, foco do teclado ou toque; Escape e clique fora fecham a ajuda. A orientação da senha também permanece visível abaixo do campo.

A interface formata o CPF e confere seus dígitos verificadores. A senha precisa ter pelo menos oito caracteres, com letras e números, e a confirmação precisa ser igual. Os erros aparecem junto aos campos. O botão confere o formulário e informa que esta etapa é visual; ele ainda não cria uma conta nem envia dados à API. O login também permanece visual.

A integração futura deverá tratar as respostas da API, incluindo e-mail ou CPF duplicado (409). A validação no navegador é complementar: o servidor e o banco continuam responsáveis por validar as entradas, garantir a unicidade e proteger as senhas.

## Organização

As subpastas de `src/` seguem a estrutura do projeto:

- `components/`: telas e componentes reutilizáveis, com seus estilos.
- `contexts/`: contexto de aparência.
- `services/`: preferência de tema e funções puras usadas pelo formulário. A decisão desta etapa é manter `cpf.js` e `validarCadastro.js` aqui, sem criar outra subpasta em `src/`.

O contexto atual trata somente o tema. Autenticação e consumo da API serão integrados em uma etapa posterior.
