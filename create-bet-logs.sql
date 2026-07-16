-- Rodar no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS bet_logs (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL,
  match_id       UUID        NOT NULL,
  home_goals     INT,
  away_goals     INT,
  success        BOOLEAN     NOT NULL,
  failure_reason TEXT,
  attempt_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bet_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados inserem próprios logs"
  ON bet_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Todos autenticados leem logs"
  ON bet_logs FOR SELECT TO authenticated
  USING (true);

-- Sem isso, "authenticated" recebe "permission denied for table bet_logs" ao
-- tentar gravar — RLS só é avaliado depois do GRANT de privilégio de tabela.
-- Faltou rodar isso no script original, e por causa disso o log nunca gravou nada.
GRANT INSERT, SELECT ON public.bet_logs TO authenticated;
