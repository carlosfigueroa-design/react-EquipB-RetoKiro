-- Migración: Trigger de inmutabilidad para audit_logs
-- Requerimiento 14.4: Los registros de auditoría son inmutables,
-- impidiendo la modificación o eliminación una vez creados.
--
-- Esta migración crea una función y dos triggers que previenen
-- operaciones UPDATE y DELETE en la tabla audit_logs.

-- Función que lanza excepción al intentar modificar o eliminar registros
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Los registros de auditoría son inmutables. No se permite UPDATE ni DELETE.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger que previene UPDATE en audit_logs
CREATE TRIGGER audit_log_immutable_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- Trigger que previene DELETE en audit_logs
CREATE TRIGGER audit_log_immutable_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();
