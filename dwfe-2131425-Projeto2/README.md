# XClone - Twitter/X Clone SPA (ReactJS + ExpressJS + Sequelize)

Este projeto consiste num clone do **Twitter/X** totalmente funcional, desenvolvido em modelo **SPA (Single Page Application)**. A aplicação possui uma interface premium com transições fluidas, carregamento de conteúdo assíncrono e um sistema completo de gestão de temas visuais (modo claro, escuro e crepúsculo com múltiplas cores de destaque).

O sistema inclui:
1. **Frontend (SPA ReactJS)** com design responsivo (Mobile e Desktop) desenvolvido em CSS puro (Vanilla CSS).
2. **Backend (API REST ExpressJS)** com arquitetura MVC utilizando **Sequelize ORM** para comunicação com base de dados MySQL (com fallback automático para SQLite).
3. **Backoffice de Administração** robusto para controlo total de utilizadores e publicações (tweets).

---

## 🚀 Funcionalidades Principais

*   **Autenticação JWT Segura**: Registo de utilizadores (com validação de nome de utilizador de 4-15 caracteres e e-mail único) e Login.
*   **Feed Dinâmico**: Abas separadas de feed global ("Para si") e feed restrito a quem o utilizador segue ("Seguindo").
*   **Publicação de Tweets**: Suporte a publicações em texto (máx. 280 caracteres) com barra de progresso visual de limite e anexos de fotos (codificadas em Base64).
*   **Sistema de Interações**: Dar/retirar "Gosto" (Likes) e responder a tweets criando árvores de discussão (threads).
*   **Ligações Sociais**: Procurar e seguir/deixar de seguir outros utilizadores no painel de sugestões ("Quem seguir").
*   **Personalização em Tempo Real (Design System)**:
    *   **Temas de Fundo**: Claro, Crepúsculo (Dim) e Escuro (Black).
    *   **Cores de Destaque**: Azul, Amarelo, Rosa, Roxo, Laranja e Verde.
    *   As definições são sincronizadas instantaneamente no `document.body` e persistidas no `localStorage`.
*   **Backoffice Administrativo (Apenas para Admins)**:
    *   Painel de métricas analíticas (total de utilizadores e tweets).
    *   Listagem completa e pesquisável de utilizadores (com possibilidade de alterar dados, passwords e privilégios de `user`/`admin`, ou apagar contas).
    *   Moderação e edição/exclusão de quaisquer tweets publicados no sistema.

---

## 🛠️ Arquitetura de Dados

O projeto utiliza a seguinte estrutura relacional de tabelas:

```sql
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(15) NOT NULL UNIQUE, -- mínimo 4 caracteres
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user' ou 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tweets (
    tweet_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reply_to_tweet_id INT NULL,
    content VARCHAR(280) NOT NULL,
    attachment_url MEDIUMTEXT, -- Suporte a fotos base64
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_tweet_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE
);

CREATE TABLE likes (
    user_id INT,
    tweet_id INT,
    PRIMARY KEY(user_id, tweet_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tweet_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE
);

CREATE TABLE follows (
    follower_id INT,
    following_id INT,
    PRIMARY KEY(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## 📂 Estrutura do Projeto

```
dwfe-2131425-Projeto2/
├── backend/                  # Servidor ExpressJS + Sequelize
│   ├── bin/www               # Script de inicialização do servidor
│   ├── config/config.json    # Configuração da base de dados Sequelize
│   ├── controllers/          # Lógica de negócio (AuthController, TweetController, AdminController, etc.)
│   ├── middlewares/          # Validação de tokens JWT e permissões de Admin
│   ├── models/               # Modelos Sequelize (User, Tweet, Like, Follow) e associação de tabelas
│   ├── routes/api.js         # Definição de todos os endpoints REST
│   ├── app.js                # Configurações do Express e middleware SPA static-fallback
│   ├── test-api.js           # Script de testes automatizados locais
│   └── package.json
│
├── frontend/                 # Aplicação ReactJS SPA
│   ├── dist/                 # Ficheiros estáticos compilados para produção
│   ├── src/
│   │   ├── assets/           # Imagens e vetores
│   │   ├── components/       # Componentes reutilizáveis (Sidebar, Widgets, TweetComposer, TweetCard)
│   │   ├── contexts/         # Estados globais (AuthContext, ThemeContext)
│   │   ├── pages/            # Páginas SPA (LandingPage, Feed, Profile, Backoffice, TweetDetail)
│   │   ├── App.jsx           # Roteamento SPA de estado e modal de personalização de cores
│   │   ├── index.css         # Design System e CSS temático (Claro/Escuro/Crepúsculo)
│   │   └── main.jsx          # Bootstrap da aplicação
│   └── package.json
└── README.md
```

---

## ⚙️ Instalação e Execução

### 1. Requisitos Prévios
Certifique-se de que tem instalados:
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   [MySQL Server](https://www.mysql.com/) (opcional; caso não detetado, a aplicação utilizará automaticamente uma base de dados SQLite local `backend/clonetwitter.sqlite` para arranque instantâneo).

### 2. Configurar a Base de Dados (Se utilizar MySQL)
Crie o esquema de base de dados no seu servidor MySQL:
```sql
CREATE DATABASE clonetwitter;
```

Edite o ficheiro `backend/config/config.json` para adicionar as suas credenciais MySQL (utilizador e palavra-passe) no ambiente `"development"`.

### 3. Configurar e Executar o Servidor (Backend)
Abra um terminal no diretório `backend`:
```bash
cd backend
npm install
```

Crie um ficheiro `.env` em `backend/` com a sua chave secreta para assinatura dos tokens JWT:
```env
JWT_SECRET=ChaveSecretaSuperProtegidaParaJWTXClone2026
```

Inicie o servidor de desenvolvimento (que corre por omissão na porta **3000**):
```bash
npm start
```
*O Sequelize tentará sincronizar os esquemas automaticamente na base de dados (`sequelize.sync({ alter: true })`).*

### 4. Configurar e Executar a Aplicação (Frontend)
Abra outro terminal no diretório `frontend`:
```bash
cd frontend
npm install
```

Para correr o servidor Vite em modo de desenvolvimento (porta **5173**):
```bash
npm run dev
```

Para compilar o código React num pacote estático otimizado para produção na pasta `dist/` (que é automaticamente servido pelo backend Express):
```bash
npm run build
```

---

## 🔌 API REST Endpoints

### Autenticação
*   `POST /api/auth/register` - Registo de novo utilizador.
*   `POST /api/auth/login` - Início de sessão e devolução do token JWT.

### Tweets
*   `GET /api/tweets` - Lista feed global ("Para si") ou feed de seguidos (`?feed=following`).
*   `POST /api/tweets` - Publica novo tweet (suporta texto, attachment base64 e replies).
*   `GET /api/tweets/:tweet_id` - Detalhes do tweet e respetivos comentários (thread).
*   `DELETE /api/tweets/:tweet_id` - Remove um tweet (apenas o autor ou admin).
*   `POST /api/tweets/:tweet_id/like` - Gostar de um tweet.
*   `DELETE /api/tweets/:tweet_id/like` - Retirar gosto de um tweet.

### Utilizadores
*   `GET /api/users/profile/:username` - Dados do perfil do utilizador e lista dos seus tweets.
*   `GET /api/users/suggestions` - Sugestões de novos utilizadores para seguir.
*   `POST /api/users/:user_id/follow` - Seguir um utilizador.
*   `DELETE /api/users/:user_id/follow` - Deixar de seguir um utilizador.

### Backoffice (Apenas para administradores)
*   `GET /api/admin/users` - Lista detalhada de todos os utilizadores registados.
*   `PUT /api/admin/users/:user_id` - Atualiza dados, password ou permissões (`role`) de um utilizador.
*   `DELETE /api/admin/users/:user_id` - Exclui permanentemente um utilizador e as suas interações.
*   `GET /api/admin/tweets` - Lista de todos os tweets no sistema.
*   `PUT /api/admin/tweets/:tweet_id` - Altera o conteúdo de um tweet.
*   `DELETE /api/admin/tweets/:tweet_id` - Remove qualquer tweet da base de dados.
