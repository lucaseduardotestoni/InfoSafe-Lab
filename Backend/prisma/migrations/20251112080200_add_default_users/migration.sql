
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "user" ("email", "passwordHash", "name", "role", "isLocked", "failedLogin", "createdAt", "updatedAt")
VALUES
  ('eduardo.zirbell@example.com', crypt('dudugay', gen_salt('bf', 10)), 'Eduardo Zirbell', 'user', false, 0, now(), now()),
  ('guilherme.kuhnen@example.com', crypt('kunhen123', gen_salt('bf', 10)), 'Guilherme Kuhnen', 'user', false, 0, now(), now()),
  ('lucas.testoni@example.com', crypt('testoni123', gen_salt('bf', 10)), 'Lucas Eduardo Testoni', 'user', false, 0, now(), now()),
  ('admin@example.com', crypt('admin@123', gen_salt('bf', 10)), 'Admin', 'admin', false, 0, now(), now());
