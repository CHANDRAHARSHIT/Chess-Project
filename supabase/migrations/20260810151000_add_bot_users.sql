-- Permanent identities for the M7 bot-fallback roster.
-- The email address is the stable external key consumed by botPlayer.ts.

INSERT INTO public."User" ("id", "name", "email")
VALUES
  ('bot-xlchess-1', 'XLChess Bot 1', 'bot1@xlchess.internal'),
  ('bot-xlchess-2', 'XLChess Bot 2', 'bot2@xlchess.internal'),
  ('bot-xlchess-3', 'XLChess Bot 3', 'bot3@xlchess.internal'),
  ('bot-xlchess-4', 'XLChess Bot 4', 'bot4@xlchess.internal'),
  ('bot-xlchess-5', 'XLChess Bot 5', 'bot5@xlchess.internal')
ON CONFLICT ("email") DO UPDATE
SET "name" = EXCLUDED."name";
