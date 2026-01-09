-- Quick check to see if migration has been applied
-- Run this in pgAdmin or psql to verify

SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN (
    'pan_no',
    'date_of_birth',
    'nominee_name',
    'nominee_relation',
    'nominee_date_of_birth',
    'case_type',
    'pdf_url'
  )
ORDER BY column_name;

-- Expected result: 7 rows
-- If you see 0 rows, the migration has NOT been run yet
-- If you see 7 rows, the migration has been successfully applied
