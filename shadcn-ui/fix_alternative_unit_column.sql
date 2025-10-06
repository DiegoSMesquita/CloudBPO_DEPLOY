-- Script para corrigir o campo alternative_unit na tabela de produtos
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos encontrar a tabela de produtos
DO $$
DECLARE
    products_table_name TEXT;
BEGIN
    -- Buscar o nome da tabela de produtos
    SELECT table_name INTO products_table_name
    FROM information_schema.tables 
    WHERE table_name LIKE '%products%' 
    AND table_schema = 'public'
    LIMIT 1;
    
    IF products_table_name IS NOT NULL THEN
        RAISE NOTICE 'Encontrou tabela de produtos: %', products_table_name;
        
        -- Verificar se a coluna alternative_unit existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = products_table_name 
            AND column_name = 'alternative_unit'
            AND table_schema = 'public'
        ) THEN
            -- Alterar o tipo da coluna para TEXT
            EXECUTE format('ALTER TABLE %I ALTER COLUMN alternative_unit TYPE TEXT USING COALESCE(alternative_unit::TEXT, NULL)', products_table_name);
            RAISE NOTICE 'Coluna alternative_unit alterada para TEXT';
        ELSE
            -- Adicionar a coluna se não existir
            EXECUTE format('ALTER TABLE %I ADD COLUMN alternative_unit TEXT', products_table_name);
            RAISE NOTICE 'Coluna alternative_unit adicionada como TEXT';
        END IF;
        
        -- Verificar se a coluna conversion_factor existe e tem o tipo correto
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = products_table_name 
            AND column_name = 'conversion_factor'
            AND table_schema = 'public'
        ) THEN
            -- Adicionar a coluna conversion_factor se não existir
            EXECUTE format('ALTER TABLE %I ADD COLUMN conversion_factor NUMERIC DEFAULT 1', products_table_name);
            RAISE NOTICE 'Coluna conversion_factor adicionada como NUMERIC';
        END IF;
        
    ELSE
        RAISE EXCEPTION 'Tabela de produtos não encontrada!';
    END IF;
END $$;

-- Verificar o resultado
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