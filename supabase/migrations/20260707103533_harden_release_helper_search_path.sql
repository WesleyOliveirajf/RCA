CREATE OR REPLACE FUNCTION public.fn_validar_movimentacao_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.fn_proteger_liberacao()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;
