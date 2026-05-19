INSERT INTO categories (id, name)
VALUES
  (gen_random_uuid()::text, 'AM'),
  (gen_random_uuid()::text, 'A1'),
  (gen_random_uuid()::text, 'A2'),
  (gen_random_uuid()::text, 'A'),
  (gen_random_uuid()::text, 'B1'),
  (gen_random_uuid()::text, 'B'),
  (gen_random_uuid()::text, 'BE'),
  (gen_random_uuid()::text, 'C1'),
  (gen_random_uuid()::text, 'C1E'),
  (gen_random_uuid()::text, 'C'),
  (gen_random_uuid()::text, 'CE'),
  (gen_random_uuid()::text, 'D1'),
  (gen_random_uuid()::text, 'D1E'),
  (gen_random_uuid()::text, 'D'),
  (gen_random_uuid()::text, 'DE'),
  (gen_random_uuid()::text, 'L'),
  (gen_random_uuid()::text, 'T')
ON CONFLICT (name) DO NOTHING;
