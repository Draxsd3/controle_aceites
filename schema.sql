-- Modify channel to allow NULL values
ALTER TABLE acceptances 
MODIFY COLUMN channel VARCHAR(50) NULL;

-- Set channel to NULL for existing DISPENSADO status records
UPDATE acceptances 
SET channel = NULL 
WHERE status = 'DISPENSADO';