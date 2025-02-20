ALTER TABLE acceptances 
MODIFY COLUMN status ENUM('ACEITE OK', 'EMISSÃO OK', 'DISPENSADO', 'PRÉ FATURAMENTO') NOT NULL;

-- Update any existing status values to 'ACEITE OK' as a fallback
UPDATE acceptances SET status = 'ACEITE OK' WHERE status NOT IN ('ACEITE OK', 'EMISSÃO OK', 'DISPENSADO', 'PRÉ FATURAMENTO');