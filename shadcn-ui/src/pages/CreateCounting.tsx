import React, { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Sector, Product } from '../lib/types';

interface CreateCountingProps {
  onClose: () => void;
  onCountingCreated: () => void;
}

const CreateCounting: React.FC<CreateCountingProps> = ({ onClose, onCountingCreated }) => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    sector_ids: [] as string[],
    product_ids: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  // CORREÇÃO: Usar TABLES importado em vez de constantes locais
  const COUNTING_SECTORS_TABLE = 'app_0bcfd220f3_counting_sectors';
  const COUNTING_PRODUCTS_TABLE = 'app_0bcfd220f3_counting_products';

  useEffect(() => {
    console.log('🔄 DEBUG: CreateCounting montado, carregando dados...');
    fetchSectors();
    fetchProducts();
  }, []);

  const fetchSectors = async () => {
    try {
      console.log('🔍 DEBUG: Buscando setores na tabela:', TABLES.SECTORS);
      const { data, error } = await supabase
        .from(TABLES.SECTORS)
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ DEBUG: Erro ao buscar setores:', error);
        throw error;
      }
      setSectors(data || []);
      console.log('✅ DEBUG: Setores carregados:', data?.length || 0, data);
    } catch (error) {
      console.error('❌ Error fetching sectors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('🔍 DEBUG: Buscando produtos na tabela:', TABLES.PRODUCTS);
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ DEBUG: Erro ao buscar produtos:', error);
        throw error;
      }
      setProducts(data || []);
      console.log('✅ DEBUG: Produtos carregados:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    }
  };

  const handleSectorChange = (sectorId: string, checked: boolean) => {
    console.log('🔄 DEBUG: Setor alterado:', sectorId, 'checked:', checked);
    console.log('🔍 DEBUG: Estado atual sector_ids ANTES:', formData.sector_ids);
    
    setFormData(prev => {
      const newSectorIds = checked 
        ? [...prev.sector_ids, sectorId]
        : prev.sector_ids.filter(id => id !== sectorId);
      
      console.log('✅ DEBUG: Setores atualizados DEPOIS:', newSectorIds);
      console.log('📊 DEBUG: Total de setores selecionados:', newSectorIds.length);
      
      return {
        ...prev,
        sector_ids: newSectorIds
      };
    });
  };

  const handleProductChange = (productId: string, checked: boolean) => {
    console.log('🔄 DEBUG: Produto alterado:', productId, 'checked:', checked);
    setFormData(prev => ({
      ...prev,
      product_ids: checked 
        ? [...prev.product_ids, productId]
        : prev.product_ids.filter(id => id !== productId)
    }));
  };

  // CORREÇÃO: Função para buscar nome do usuário pelo ID
  const fetchUserName = async (userId: string): Promise<string> => {
    try {
      console.log('🔍 CORREÇÃO: Buscando nome do usuário para criação:', userId);
      
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('name')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('❌ CORREÇÃO: Erro ao buscar usuário:', userError);
        return 'Funcionário Não Identificado';
      }
      
      if (!userData || !userData.name) {
        console.log('⚠️ CORREÇÃO: Usuário sem nome encontrado');
        return 'Funcionário Não Identificado';
      }
      
      console.log('✅ CORREÇÃO: Nome do usuário encontrado:', userData.name);
      return userData.name;
    } catch (error) {
      console.error('❌ CORREÇÃO: Exceção ao buscar nome do usuário:', error);
      return 'Funcionário Não Identificado';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🚀 DEBUG: ===== INICIANDO CRIAÇÃO DE CONTAGEM =====');
    console.log('📋 DEBUG: Dados completos do formulário:', formData);
    console.log('🎯 DEBUG: Setores selecionados (FINAL):', formData.sector_ids);
    console.log('📊 DEBUG: Quantidade de setores selecionados:', formData.sector_ids.length);
    console.log('📦 DEBUG: Produtos selecionados:', formData.product_ids);
    console.log('📊 DEBUG: Quantidade de produtos selecionados:', formData.product_ids.length);

    // VALIDAÇÃO ADICIONAL: Verificar se pelo menos um setor foi selecionado
    if (formData.sector_ids.length === 0) {
      console.log('⚠️ DEBUG: ATENÇÃO - Nenhum setor selecionado!');
      alert('Por favor, selecione pelo menos um setor para a contagem.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('👤 DEBUG: Usuário autenticado:', user.id);

      // CORREÇÃO: Buscar nome do usuário antes de criar a contagem
      const userName = await fetchUserName(user.id);
      console.log('👤 CORREÇÃO: Nome do usuário obtido:', userName);

      // Create the counting
      console.log('🔄 DEBUG: Criando contagem na tabela:', TABLES.COUNTINGS);
      const { data: counting, error: countingError } = await supabase
        .from(TABLES.COUNTINGS)
        .insert([
          {
            name: formData.name,
            description: formData.description,
            deadline: formData.deadline,
            status: 'active',
            created_by: user.id,
            employee_name: userName, // CORREÇÃO: Adicionar nome do funcionário
            company_id: user.user_metadata?.company_id
          }
        ])
        .select()
        .single();

      if (countingError) {
        console.error('❌ DEBUG: Erro ao criar contagem:', countingError);
        throw countingError;
      }
      console.log('✅ DEBUG: Contagem criada com sucesso:', counting.id);

      // CORREÇÃO CRÍTICA: Create counting_sectors relationships
      console.log('🔍 DEBUG: ===== INSERINDO SETORES =====');
      console.log('📊 DEBUG: Setores a inserir:', formData.sector_ids);
      console.log('📊 DEBUG: Quantidade final:', formData.sector_ids.length);
      
      if (formData.sector_ids.length > 0) {
        const sectorRelations = formData.sector_ids.map(sectorId => {
          console.log('🔄 DEBUG: Preparando setor para inserção:', sectorId);
          return {
            counting_id: counting.id,
            sector_id: sectorId
          };
        });

        console.log('🔄 DEBUG: Inserindo setores na tabela:', COUNTING_SECTORS_TABLE);
        console.log('📋 DEBUG: Dados completos dos setores a inserir:', sectorRelations);

        const { data: sectorInsertResult, error: sectorError } = await supabase
          .from(COUNTING_SECTORS_TABLE)
          .insert(sectorRelations)
          .select();

        if (sectorError) {
          console.error('❌ DEBUG: Erro ao inserir setores:', sectorError);
          console.error('❌ DEBUG: Detalhes do erro:', sectorError.message);
          console.error('❌ DEBUG: Dados que causaram erro:', sectorRelations);
          throw sectorError;
        }
        
        console.log('✅ DEBUG: Setores inseridos com sucesso!');
        console.log('📋 DEBUG: Resultado da inserção:', sectorInsertResult);
        console.log('📊 DEBUG: Quantidade de setores inseridos:', sectorInsertResult?.length || 0);
      } else {
        console.log('⚠️ DEBUG: NENHUM SETOR SELECIONADO - pulando inserção');
      }

      // CORREÇÃO: Create counting_products relationships
      if (formData.product_ids.length > 0) {
        const productRelations = formData.product_ids.map(productId => ({
          counting_id: counting.id,
          product_id: productId
        }));

        console.log('🔄 DEBUG: Inserindo produtos na tabela:', COUNTING_PRODUCTS_TABLE);
        console.log('📋 DEBUG: Dados dos produtos a inserir:', productRelations);

        const { data: productInsertResult, error: productError } = await supabase
          .from(COUNTING_PRODUCTS_TABLE)
          .insert(productRelations)
          .select();

        if (productError) {
          console.error('❌ DEBUG: Erro ao inserir produtos:', productError);
          throw productError;
        }
        
        console.log('✅ DEBUG: Produtos inseridos com sucesso!');
        console.log('📋 DEBUG: Resultado da inserção:', productInsertResult);
      } else {
        console.log('⚠️ DEBUG: NENHUM PRODUTO SELECIONADO - pulando inserção');
      }

      console.log('🎉 DEBUG: ===== CONTAGEM CRIADA COM SUCESSO =====');
      console.log('🎉 DEBUG: ID da contagem:', counting.id);
      console.log('🎉 DEBUG: Setores associados:', formData.sector_ids.length);
      console.log('🎉 DEBUG: Produtos associados:', formData.product_ids.length);
      console.log('🎉 DEBUG: Nome do funcionário salvo:', userName);
      
      onCountingCreated();
      onClose();
    } catch (error) {
      console.error('❌ DEBUG: ===== ERRO GERAL NA CRIAÇÃO =====');
      console.error('❌ DEBUG: Erro:', error);
      console.error('❌ DEBUG: Dados do formulário no momento do erro:', formData);
      alert('Erro ao criar contagem: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nova Contagem</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Descreva o objetivo desta contagem..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prazo *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setores ({sectors.length} disponíveis)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {sectors.length === 0 ? (
                <p className="text-gray-500 text-sm">Carregando setores...</p>
              ) : (
                sectors.map(sector => (
                  <label key={sector.id} className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={formData.sector_ids.includes(sector.id)}
                      onChange={(e) => handleSectorChange(sector.id, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{sector.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecionados: {formData.sector_ids.length}
            </p>
            {/* FEEDBACK VISUAL MELHORADO */}
            {formData.sector_ids.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-800 mb-1">Setores selecionados:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.sector_ids.map(sectorId => {
                    const sector = sectors.find(s => s.id === sectorId);
                    return (
                      <span key={sectorId} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {sector?.name || sectorId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produtos ({products.length} disponíveis)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">Carregando produtos...</p>
              ) : (
                products.map(product => (
                  <label key={product.id} className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={formData.product_ids.includes(product.id)}
                      onChange={(e) => handleProductChange(product.id, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{product.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecionados: {formData.product_ids.length}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Contagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCounting;