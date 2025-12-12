# Dr. Passei - Cronograma de Estudos para Residência Médica 🩺

Plataforma SaaS (Software as a Service) focada na organização, métricas e personalização de estudos para provas de residência médica.

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Tech](https://img.shields.io/badge/Stack-React_|_Supabase_|_Tailwind-0ea5e9)

## 🚀 Funcionalidades

- **Gestão de Planos**: Criação de múltiplos cronogramas personalizados (ex: R1 USP, PSU-MG).
- **Edital Organizado**: 
  - Cadastro de Disciplinas e Tópicos.
  - **Novo**: Edição e exclusão de conteúdos já cadastrados.
- **Registro de Questões**: 
  - Lançamento de desempenho (acertos/erros).
  - **Automático (D0)**: O estudo do dia é registrado automaticamente como concluído no histórico.
- **Calendário Interativo**: Visualização mensal de todas as revisões pendentes e concluídas.
- **Revisão Espaçada**: Agendamento automático de revisões (ex: 7, 14, 30 dias) com base na data de estudo.
- **Analytics**: 
  - Gráficos de evolução de desempenho.
  - KPIs de tópicos estudados vs. total.
  - Análise de precisão por disciplina.
- **Modo Híbrido**: Funciona Local (Offline) e na Nuvem (Supabase).

## 🛠 Tecnologias Utilizadas

- **Frontend**: React 19 (Hooks, Context), TypeScript.
- **UI/UX**: Tailwind CSS, Lucide Icons.
- **Dados**: Recharts (Visualização de Dados).
- **Backend/Database**: Supabase (PostgreSQL + Row Level Security).

## ⚙️ Configuração do Supabase (Para Salvar na Nuvem)

Para que seus dados fiquem salvos online e acessíveis de qualquer dispositivo:

1. **Crie uma conta:** Acesse [Supabase.com](https://supabase.com).
2. **Crie um projeto:** Dê um nome (ex: DrPassei).
3. **Configure o Banco de Dados:** Vá na aba **SQL Editor** e rode este script:

```sql
-- Cria a tabela de planos
create table if not exists plans (
  id text primary key,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilita segurança
alter table plans enable row level security;

-- Cria política de acesso (Nota: Em produção, adicione Auth do Supabase)
create policy "Acesso Publico" 
on plans for all using (true) with check (true);
```

4. **Pegue as Chaves (API Keys):**
   - Vá em **Project Settings** > **API**.
   - Copie a **URL** e a chave **anon public**.

5. **Configure no Vercel (Hospedagem):**
   - No painel do seu projeto no Vercel, vá em **Settings** > **Environment Variables**.
   - Adicione as variáveis:
     - `VITE_SUPABASE_URL`: (Sua URL)
     - `VITE_SUPABASE_ANON_KEY`: (Sua Chave Anon)
   - Faça um novo Deploy.

---

**Dr. Passei** - *Aprovação organizada e baseada em dados.*