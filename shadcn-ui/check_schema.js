import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djqcowblopblhbrndkmx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcWNvd2Jsb3BibGhicm5ka214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTkzMTcsImV4cCI6MjA3MzE5NTMxN30.nEPbPSGQs6dgRfU8HWWlqglj7R9XfRCHxavFEST5-BU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCountingItemsSchema() {
  try {
    console.log('🔍 Verificando estrutura da tabela counting_items...');
    
    // Tentar inserir um item de teste para ver o erro
    const testItem = {
      counting_id: '00000000-0000-0000-0000-000000000000',
      product_id: '00000000-0000-0000-0000-000000000000',
      counted_quantity: 1,
      quantity: 1,
      counted_by: 'Pedro',
      counted_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('app_0bcfd220f3_counting_items')
      .insert(testItem)
      .select();
    
    if (error) {
      console.error('❌ ERRO DETECTADO:', error.message);
      console.error('📋 Detalhes do erro:', error);
      
      if (error.message.includes('invalid input syntax for type uuid')) {
        console.log('🎯 PROBLEMA CONFIRMADO: Campo counted_by está configurado como UUID mas recebe string!');
        console.log('🔧 SOLUÇÃO: Alterar tipo do campo counted_by de UUID para TEXT');
      }
    } else {
      console.log('✅ Inserção bem-sucedida:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

checkCountingItemsSchema();