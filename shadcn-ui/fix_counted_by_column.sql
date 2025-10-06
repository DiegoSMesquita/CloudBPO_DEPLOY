-- ================================================
-- SCRIPT PARA RECRIAR COLUNA COUNTED_BY
-- Executar no Supabase SQL Editor
-- ================================================
-- 
-- PROBLEMA: Campo counted_by configurado como UUID mas recebe TEXT
-- SOLUÇÃO: Remover coluna UUID e criar nova coluna TEXT
-- RESULTADO: Aceitar nomes como "Pedro", "Maria", etc.
--
-- ================================================

BEGIN;

-- 1. 🗑️ REMOVER COLUNA PROBLEMÁTICA (UUID)
ALTER TABLE app_0bcfd220f3_counting_items 
DROP COLUMN IF EXISTS counted_by;

-- 2. ➕ CRIAR NOVA COLUNA (TEXT)
ALTER TABLE app_0bcfd220f3_counting_items 
ADD COLUMN counted_by TEXT;

-- 3. 📝 ADICIONAR COMENTÁRIO EXPLICATIVO
COMMENT ON COLUMN app_0bcfd220f3_counting_items.counted_by 
IS 'Nome do funcionário que realizou a contagem (ex: Pedro, Maria)';

-- 4. ✅ VERIFICAR ESTRUTURA CRIADA
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'app_0bcfd220f3_counting_items' 
AND column_name = 'counted_by';

COMMIT;

-- ================================================
-- INSTRUÇÕES DE USO:
-- ================================================
-- 
-- 1. Copie todo este script
-- 2. Acesse o Supabase Dashboard
-- 3. Vá para SQL Editor
-- 4. Cole o script completo
-- 5. Execute (Run)
-- 6. Verifique se o resultado mostra:
--    counted_by | text | YES | (null)
--
-- ================================================
-- TESTE APÓS EXECUÇÃO:
-- ================================================
-- 
-- INSERT INTO app_0bcfd220f3_counting_items (
--     counting_id,
--     product_id, 
--     counted_quantity,
--     counted_by
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     '00000000-0000-0000-0000-000000000000',
--     1,
--     'Pedro'
-- );
-- 
-- Se não der erro, a correção funcionou!
-- ================================================