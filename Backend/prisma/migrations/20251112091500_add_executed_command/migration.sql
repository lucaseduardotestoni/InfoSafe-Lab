-- Add executed_command column to audit_logs
ALTER TABLE "audit_logs"
ADD COLUMN IF NOT EXISTS "executed_command" TEXT;
