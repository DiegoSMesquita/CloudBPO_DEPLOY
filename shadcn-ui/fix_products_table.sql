-- Fix products table structure for conversion factors
-- This script fixes the alternative_unit field type issue

BEGIN;

-- Check if the products table exists and get its structure
DO $$
DECLARE
    table_exists boolean;
    column_exists boolean;
    column_type text;
BEGIN
    -- Check if any products table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name LIKE '%products%' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get the actual table name (it might be prefixed)
        FOR table_name IN 
            SELECT t.table_name 
            FROM information_schema.tables t
            WHERE t.table_name LIKE '%products%' 
            AND t.table_schema = 'public'
        LOOP
            RAISE NOTICE 'Found products table: %', table_name;
            
            -- Check if alternative_unit column exists
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = table_name 
                AND column_name = 'alternative_unit'
                AND table_schema = 'public'
            ) INTO column_exists;
            
            IF column_exists THEN
                -- Get current column type
                SELECT data_type INTO column_type
                FROM information_schema.columns 
                WHERE table_name = table_name 
                AND column_name = 'alternative_unit'
                AND table_schema = 'public';
                
                RAISE NOTICE 'Column alternative_unit exists with type: %', column_type;
                
                -- If it's not text/varchar, alter it
                IF column_type NOT IN ('text', 'character varying', 'varchar') THEN
                    RAISE NOTICE 'Altering column type from % to TEXT', column_type;
                    EXECUTE format('ALTER TABLE %I ALTER COLUMN alternative_unit TYPE TEXT USING alternative_unit::TEXT', table_name);
                END IF;
            ELSE
                -- Add the column if it doesn't exist
                RAISE NOTICE 'Adding alternative_unit column to table %', table_name;
                EXECUTE format('ALTER TABLE %I ADD COLUMN alternative_unit TEXT', table_name);
            END IF;
            
            -- Ensure conversion_factor exists and is numeric
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = table_name 
                AND column_name = 'conversion_factor'
                AND table_schema = 'public'
            ) INTO column_exists;
            
            IF NOT column_exists THEN
                RAISE NOTICE 'Adding conversion_factor column to table %', table_name;
                EXECUTE format('ALTER TABLE %I ADD COLUMN conversion_factor NUMERIC DEFAULT 1', table_name);
            END IF;
        END LOOP;
    ELSE
        RAISE NOTICE 'No products table found!';
    END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name LIKE '%products%' 
AND column_name IN ('alternative_unit', 'conversion_factor')
AND table_schema = 'public'
ORDER BY table_name, column_name;