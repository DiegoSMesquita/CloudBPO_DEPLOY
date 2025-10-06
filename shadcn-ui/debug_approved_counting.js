const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://vwqhkqzgzpqhkqzgzpqh.supabase.co'; // Substitua pela sua URL
const supabaseKey = 'your-anon-key'; // Substitua pela sua chave

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugApprovedCounting() {
  console.log('🔍 ===== DIAGNÓSTICO: CONTAGEM 051 APROVADA =====');
  
  try {
    // 1. Verificar se a contagem 051 existe e está aprovada
    console.log('\n1️⃣ Verificando contagem ID 051...');
    const { data: counting, error: countingError } = await supabase
      .from('app_0bcfd220f3_countings')
      .select('*')
      .or('internal_id.eq.051,id.eq.051')
      .single();
    
    if (countingError) {
      console.error('❌ Erro ao buscar contagem:', countingError);
      return;
    }
    
    if (!counting) {
      console.error('❌ Contagem 051 não encontrada');
      return;
    }
    
    console.log('✅ Contagem encontrada:', {
      id: counting.id,
      internal_id: counting.internal_id,
      name: counting.name,
      status: counting.status,
      approved_at: counting.approved_at,
      company_id: counting.company_id
    });

    // 2. Verificar itens da contagem
    console.log('\n2️⃣ Verificando itens contados...');
    const { data: countingItems, error: itemsError } = await supabase
      .from('app_0bcfd220f3_counting_items')
      .select('*')
      .eq('counting_id', counting.id);
    
    if (itemsError) {
      console.error('❌ Erro ao buscar itens:', itemsError);
    } else {
      console.log(`✅ Itens encontrados: ${countingItems?.length || 0}`);
      if (countingItems && countingItems.length > 0) {
        console.log('📊 Primeiros 3 itens:', countingItems.slice(0, 3).map(item => ({
          product_id: item.product_id,
          counted_quantity: item.counted_quantity,
          counted_by: item.counted_by
        })));
      }
    }

    // 3. Verificar se movimentações foram criadas
    console.log('\n3️⃣ Verificando movimentações geradas...');
    const { data: movements, error: movementsError } = await supabase
      .from('app_0bcfd220f3_product_movements')
      .select('*')
      .eq('reference_id', counting.id);
    
    if (movementsError) {
      console.error('❌ Erro ao buscar movimentações:', movementsError);
    } else {
      console.log(`📈 Movimentações encontradas: ${movements?.length || 0}`);
      if (movements && movements.length > 0) {
        console.log('📊 Primeiras 3 movimentações:', movements.slice(0, 3).map(mov => ({
          product_id: mov.product_id,
          movement_type: mov.movement_type,
          quantity_before: mov.quantity_before,
          quantity_after: mov.quantity_after,
          created_at: mov.created_at
        })));
      }
    }

    // 4. Verificar estrutura da tabela de movimentações
    console.log('\n4️⃣ Verificando estrutura da tabela de movimentações...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'app_0bcfd220f3_product_movements');
    
    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError);
    } else {
      console.log('📋 Colunas da tabela product_movements:', tableInfo?.map(col => `${col.column_name} (${col.data_type})`));
    }

    // 5. Verificar função de aprovação no código
    console.log('\n5️⃣ ANÁLISE DO PROBLEMA:');
    
    if (counting.status === 'approved') {
      console.log('✅ Status: Contagem está marcada como aprovada');
      
      if (!movements || movements.length === 0) {
        console.log('❌ PROBLEMA IDENTIFICADO: Movimentações não foram geradas!');
        console.log('\n🔧 POSSÍVEIS CAUSAS:');
        console.log('1. Função handleApproveCounting() não está gerando movimentações');
        console.log('2. Tabela product_movements não existe ou tem nome incorreto');
        console.log('3. Erro silencioso na criação das movimentações');
        console.log('4. Campo reference_id não está sendo preenchido corretamente');
        
        console.log('\n🛠️ SOLUÇÕES RECOMENDADAS:');
        console.log('1. Verificar função handleApproveCounting em Countings.tsx');
        console.log('2. Adicionar criação de movimentações após aprovação');
        console.log('3. Verificar se tabela product_movements existe');
        console.log('4. Testar criação manual de movimentação');
      } else {
        console.log('✅ Movimentações foram criadas corretamente');
      }
    } else {
      console.log(`⚠️ Status: Contagem não está aprovada (${counting.status})`);
    }

    // 6. Verificar todas as movimentações da empresa
    console.log('\n6️⃣ Verificando todas as movimentações da empresa...');
    const { data: allMovements, error: allMovError } = await supabase
      .from('app_0bcfd220f3_product_movements')
      .select('*')
      .eq('company_id', counting.company_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allMovError) {
      console.error('❌ Erro ao buscar todas as movimentações:', allMovError);
    } else {
      console.log(`📊 Total de movimentações da empresa: ${allMovements?.length || 0}`);
      if (allMovements && allMovements.length > 0) {
        console.log('📋 Últimas movimentações:', allMovements.map(mov => ({
          id: mov.id,
          movement_type: mov.movement_type,
          reference_id: mov.reference_id,
          created_at: mov.created_at
        })));
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
  
  console.log('\n🔍 ===== FIM DO DIAGNÓSTICO =====');
}

// Executar diagnóstico
debugApprovedCounting();