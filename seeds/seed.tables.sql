BEGIN;

TRUNCATE
  "word",
  "language",
  "user";

INSERT INTO "user" ("id", "username", "name", "password")
VALUES
  (
    1,
    'admin',
    'Dunder Mifflin Admin',
    -- password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG'
  );

INSERT INTO "language" ("id", "name", "user_id")
VALUES
<<<<<<< HEAD
  (1, 'Fremch', 1);
=======
  (1, 'Spanish', 1);
>>>>>>> 9236892488380b599acfb6428037fd924341bc67

INSERT INTO "word" ("id", "language_id", "original", "translation", "next")
VALUES
  (1, 1, 'cerveza', 'beer', 2),
  (2, 1, 'mañana', 'tomorrow', 3),
  (3, 1, 'gracias', 'thanks', 4),
  (4, 1, 'necesito', 'I need', 5),
  (5, 1, 'bien', 'good', 6),
  (6, 1, 'mal', 'bad', 7),
  (7, 1, 'grande', 'big', 8),
  (8, 1, 'gato', 'cat', 9),
  (9, 1, 'pequeño', 'small', 10),
  (10, 1, 'perro', 'dog', null);

UPDATE "language" SET head = 1 WHERE id = 1;

-- because we explicitly set the id fields
-- update the sequencer for future automatic id setting
SELECT setval('word_id_seq', (SELECT MAX(id) from "word"));
SELECT setval('language_id_seq', (SELECT MAX(id) from "language"));
SELECT setval('user_id_seq', (SELECT MAX(id) from "user"));

COMMIT;
