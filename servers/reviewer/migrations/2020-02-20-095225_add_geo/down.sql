-- This file should undo anything in `up.sql`
ALTER TABLE reviews
DROP COLUMN scheme,
DROP COLUMN coordinates,
DROP COLUMN uncertainty;