# 🏆 Mundial Simulador — Simulador da Copa do Mundo FIFA 2026

Aplicação web completa e interativa para simulação da Copa do Mundo FIFA 2026, com prancheta tática 3D, histórico completo de confrontos diretos, simulador de mata-mata/grupos com súmulas dinâmicas em tempo real e integração com banco de dados na nuvem.

---

## 🛠️ Stack Tecnológica

- **Frontend Framework:** React 18 + TypeScript
- **Ferramenta de Build:** Vite
- **Estilização & Design System:** Tailwind CSS v4 + Animações CSS com Conic Gradients
- **Animações & Interatividade:** Motion (`motion/react`)
- **Ícones:** Lucide React
- **Banco de Dados & Backend:** Google Cloud Firebase (Cloud Firestore & Authentication)
- **Gerenciamento de Estado em Tempo Real:** Firestore Realtime Snapshots (`onSnapshot`)

---

## 🔒 Implementações de Segurança e Comunicação

### 1. Zero Exposição de Chaves Privadas (Zero Exposure)
- **Privacidade de Segredos:** Todas as chaves e variáveis sensíveis da aplicação são mantidas exclusivamente no ambiente do servidor (`process.env.GEMINI_API_KEY`, `APP_URL`).
- **Nenhuma chave sensível exposta ao cliente:** Nenhuma chave secreta utiliza os prefixos públicos como `VITE_` ou `NEXT_PUBLIC_`, garantindo que credenciais privadas nunca vazem no bundle baixado pelo navegador do usuário.

### 2. Cabeçalhos de Segurança & CSP (Content Security Policy)
- **Politica de Origem e Conteúdo (CSP):** Definida via meta tags estruturadas em `index.html`, restringindo a execução de scripts e conexões exclusivamente a origens autorizadas (`*.firebaseapp.com`, `*.googleapis.com`, `*.run.app`).
- **Proteção Anticlacking (X-Frame-Options):** Configurado com `SAMEORIGIN` para prevenir ataques de mascaramento por iFrames maliciosos.
- **Prevenção de MIME Sniffing:** Header `X-Content-Type-Options: nosniff` ativo.
- **Politica de Referenciador Segura:** `strict-origin-when-cross-origin` aplicada para vazamento zero de parâmetros de URL.

### 3. Dupla Validação e Sanitização de Dados
- **Sanitizador Recursivo de Dados (`sanitizeForFirestore`):** Filtra e remove recursivamente valores `undefined` e estruturas inválidas antes que qualquer operação de escrita seja submetida ao banco de dados.
- **Tratamento Robusto de Erros de Firestore:** Captura detalhada de erros com contexto de autenticação e tipo de operação (`OperationType.WRITE`, `OperationType.GET`, etc.).

### 4. Hardening do Banco de Dados (Firestore Security Rules)
- **Validação Estrita de Esquema:** O arquivo `firestore.rules` valida tipos de dados, limites de tamanho de campos e formatos para cada coleção (`saved_tournaments`, `match_histories`, `team_configs`).
- **Histórico Imutável:** Registros de partidas concluídas em `match_histories` são definidos como imutáveis (`allow update, delete: if false;`), impedindo adulterações de placares salvos.
- **Acesso Negado por Padrão (Default Deny):** Coleções não declaradas explicitamente são bloqueadas para qualquer leitura ou escrita.

---

## 🎨 Design Visual & Estética

- **Tema Cinza Escuro & Preto Absoluto:** Identidade visual baseada em tons sofisticados de cinza carvão (`#09090b`, `#121214`) e preto, eliminando distração visual.
- **Destaques em Ouro Imperial (Amber/Yellow Glow):** Accent em amarelo/dourado (`#f59e0b`) para destacar campeões, botões de ação e emblemas da Copa.
- **Anéis Neon Dinâmicos e Cartões de Vidro:** Cards com efeito Glassmorphism suave, bordas translúcidas e anéis giratórios RGB/Gold com `conic-gradient`.

---

## 📱 Responsividade & UX

- **Layout Fluido & Mobile-First:** Adaptável para dispositivos móveis, tablets e telas desktop de ultra-alta resolução.
- **Tamanhos de Toque Otimizados:** Botões com área de clique/toque de no mínimo 44px para interação tátil em dispositivos móveis.
- **Navegação Intuitiva:** Barra de navegação com tabs e transições suaves entre o Simulador de Mata-mata, Prancheta Tática 3D, Histórico H2H e Cantinho dos Craques.

---

## 📊 Banco de Dados & Funcionalidades

1. **Simulador de Mata-Mata e Grupos:**
   - Montagem automática do chaveamento das oitavas, quartas, semifinal e grande final.
   - Simulação lance a lance com narração, súmula de gols, cartões e estatísticas de jogo.
2. **Salvamento e Sincronização na Nuvem:**
   - Salva o progresso do torneio ativo no Firestore para retomada em qualquer sessão.
3. **Prancheta Tática de Elencos:**
   - Visualização da formação tática titular das seleções no campo virtual 3D.
4. **Histórico de Confrontos Diretos (Head-to-Head):**
   - Comparativo de retrospeto histórico, vitórias, gols e confrontos inesquecíveis da Copa do Mundo.

---

*Mundial Simulador © 2026 — Desenvolvido com foco em alta performance, segurança e experiência imersiva.*
