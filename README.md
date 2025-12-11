# Dr. Passei - Cronograma de Estudos para Residência Médica 🩺

Plataforma SaaS (Software as a Service) focada na organização, métricas e personalização de estudos para provas de residência médica.

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Tech](https://img.shields.io/badge/Stack-React_|_Supabase_|_Tailwind-0ea5e9)

## 🚀 Funcionalidades

- **Gestão de Planos**: Criação de múltiplos cronogramas personalizados (ex: R1 USP, PSU-MG).
- **Edital Organizado**: Cadastro de Disciplinas e Tópicos.
- **Registro de Questões**: Lançamento de desempenho (acertos/erros) e controle de teoria.
- **Revisão Espaçada**: Agendamento automático de revisões (ex: 7, 14, 30 dias) com base na data de estudo.
- **Analytics**: 
  - Gráficos de evolução de desempenho.
  - KPIs de tópicos estudados vs. total.
  - Análise de precisão por disciplina.

## 🛠 Tecnologias Utilizadas

- **Frontend**: React 19 (Hooks, Context), TypeScript.
- **UI/UX**: Tailwind CSS, Lucide Icons.
- **Dados**: Recharts (Visualização de Dados).
- **Backend/Database**: Supabase (PostgreSQL + Row Level Security).

## ⚙️ Configuração do Supabase

Este projeto utiliza o Supabase para persistência de dados. Para rodar o projeto com funcionalidades na nuvem:

1. Crie uma conta e um projeto em [Supabase.com](https://supabase.com).
2. Vá até a aba **SQL Editor** no painel do Supabase e execute o seguinte script:

```sql
-- Cria a tabela de planos
create table if not exists plans (
  id text primary key,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita segurança
alter table plans enable row level security;

-- Cria política de acesso (DEV/MVP)
-- Nota: Em produção, configure autenticação e altere para auth.uid()
create policy "Acesso Publico" 
on plans for all using (true) with check (true);
```

3. Nas configurações do projeto (Project Settings > API), copie a **Project URL** e a **anon public key**.
4. No código do projeto, abra o arquivo `supabaseClient.ts` e atualize as variáveis:

```typescript
const supabaseUrl = 'SUA_URL_DO_SUPABASE';
const supabaseKey = 'SUA_CHAVE_ANONIMA';
```

## 📦 Instalação e Execução

Este projeto foi construído para ser leve e moderno, utilizando *ES Modules* diretamente via browser ou bundlers modernos.

### Opção 1: WebContainer / StackBlitz / Codesandbox
O projeto roda nativamente nestes ambientes sem configuração extra.

### Opção 2: Localmente (Vite)
Se desejar rodar em sua máquina:
1. Clone o repositório.
2. Instale as dependências (caso migre para npm/vite).
3. Execute o servidor de desenvolvimento.

---

**Dr. Passei** - *Aprovação organizada e baseada em dados.*