import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Save, CheckCircle, Clock, Package, AlertTriangle, Plus, Minus, Calendar, X } from 'lucide-react';
import { supabase, TABLES } from '../lib/supabase';
import type { Counting, CountingItem, Product, Sector } from '../lib/types';

const CountingMobile: React.FC = () => {
  const { countingId } = useParams<{ countingId: string }>();

  const [counting, setCounting] = useState<Counting | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [countingItems, setCountingItems] = useState<CountingItem[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [savingProgress, setSavingProgress] = useState(false);
  const [completingCounting, setCompletingCounting] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [countingDisplayId, setCountingDisplayId] = useState<string>('');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Estado para calculadora de conversão - RESTAURADO
  const [calculatorInputs, setCalculatorInputs] = useState<{[productId: string]: string}>({});
  
  // Estado para controlar valores de input de quantidade
  const [quantityInputs, setQuantityInputs] = useState<{[productId: string]: string}>({});

  // Use correct table names with system prefix
  const COUNTING_ITEMS_TABLE = 'app_0bcfd220f3_counting_items';
  const COUNTING_SECTORS_TABLE = 'app_0bcfd220f3_counting_sectors';

  // Safe string conversion helper
  const safeString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  // Função para verificar se permite vírgula
  const allowsFractionalInput = (unit?: string): boolean => {
    if (!unit) return true;
    
    const unitUpper = unit.toUpperCase().trim();
    
    // Lista de unidades que NÃO permitem vírgula (apenas inteiros)
    const integerOnlyUnits = [
      'UNIDADE', 'UNIDADES', 'UNID', 'UND', 'UN',
      'PEÇA', 'PEÇAS', 'PC', 'PCS',
      'CAIXA', 'CAIXAS', 'CX',
      'PACOTE', 'PACOTES', 'PCT',
      'FRASCO', 'FRASCOS',
      'TUBO', 'TUBOS',
      'ROLO', 'ROLOS'
    ];
    
    return !integerOnlyUnits.includes(unitUpper);
  };

  // Helper function to convert string with comma to number
  const parseDecimalInput = (value: string): number => {
    if (!value || value === '') return 0;
    // Replace comma with dot for parsing
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to check if counting is approved
  const isCountingApproved = (status: string): boolean => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'approved' || normalizedStatus === 'aprovada';
  };

  // Helper function to get product unit for display
  const getProductUnit = (product: Product): string => {
    return product.unit || product.alternativeUnit || 'unidades';
  };

  // Função para formatar quantidade para exibição
  const formatQuantityForDisplay = (quantity: number, unit: string): string => {
    const allowsFractional = allowsFractionalInput(unit);
    
    if (allowsFractional) {
      return quantity.toString().replace('.', ',');
    } else {
      return Math.floor(quantity).toString();
    }
  };

  // Função para buscar nome do usuário pelo ID
  const fetchUserName = async (userId: string): Promise<string> => {
    try {
      console.log('🔍 CORREÇÃO: Buscando nome do usuário:', userId);
      
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

  // Check if Supabase is available
  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return false;
      }
      
      // Test connection with a simple query
      const { error } = await supabase
        .from(TABLES.COMPANIES)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection verified');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection check failed:', error);
      return false;
    }
  };

  // Toast notification component
  const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
    <div className={`fixed top-4 left-4 right-4 z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white p-4 rounded-lg shadow-lg flex items-center justify-between animate-slide-down`}>
      <div className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center`}>
          {type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-white" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    if (type === 'success') {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }
  };

  useEffect(() => {
    if (countingId) {
      loadCountingData();
    } else {
      setError('ID da contagem não fornecido');
      setLoading(false);
    }
  }, [countingId]);

  // Update time remaining every minute
  useEffect(() => {
    if (deadline) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const timeDiff = deadline.getTime() - now.getTime();
        
        if (timeDiff <= 0) {
          setTimeRemaining('Expirado');
          setIsExpired(true);
          return;
        }
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        if (minutes > 0) timeString += `${minutes}m`;
        
        const finalTime = timeString.trim() || '< 1m';
        setTimeRemaining(finalTime);
      };
      
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [deadline]);

  const formatDeadline = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemainingColor = (): string => {
    if (!deadline) return 'text-gray-600';
    
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);
    
    if (hoursRemaining <= 0) return 'text-red-600';
    if (hoursRemaining <= 24) return 'text-red-500';
    if (hoursRemaining <= 48) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCountingDeadline = (countingData: Record<string, unknown>): Date | null => {
    console.log('🔍 Verificando campos de prazo disponíveis:', Object.keys(countingData));
    
    // PRIORIDADE 1: scheduled_date + scheduled_time (usado no desktop)
    if (countingData.scheduled_date && countingData.scheduled_time) {
      const dateTimeString = `${countingData.scheduled_date}T${countingData.scheduled_time}`;
      console.log('✅ Usando scheduled_date + scheduled_time:', dateTimeString);
      const scheduledDeadline = new Date(dateTimeString);
      return scheduledDeadline;
    }
    
    // PRIORIDADE 2: due_date
    if (countingData.due_date) {
      console.log('✅ Usando due_date:', countingData.due_date);
      const dueDateDeadline = new Date(countingData.due_date as string);
      return dueDateDeadline;
    }
    
    // PRIORIDADE 3: expires_at
    if (countingData.expires_at) {
      console.log('✅ Usando expires_at:', countingData.expires_at);
      const expiresDeadline = new Date(countingData.expires_at as string);
      return expiresDeadline;
    }
    
    // Fallback: 7 dias após criação
    console.log('⚠️ Nenhum campo de prazo encontrado, usando fallback de 7 dias');
    const createdAt = new Date(countingData.created_at as string);
    const fallbackDeadline = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return fallbackDeadline;
  };

  const loadCountingData = async () => {
    if (!countingId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 MOBILE: Carregando dados da contagem:', countingId);
      
      // First check if Supabase is available
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) {
        throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão com a internet.');
      }
      
      // Buscar contagem por ID
      const { data: countingData, error: countingError } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('id', countingId)
        .single();
      
      if (countingError) {
        console.error('❌ MOBILE: Error loading counting:', countingError);
        throw new Error(`Erro ao carregar contagem: ${countingError.message}`);
      }
      
      if (!countingData) {
        console.error('❌ MOBILE: Contagem não encontrada');
        setError('Contagem não encontrada');
        return;
      }

      console.log('✅ MOBILE: Contagem carregada:', countingData);

      // CORREÇÃO CRÍTICA: Priorizar employee_name salvo na criação
      let employeeDisplayName = 'Funcionário Não Identificado';
      
      console.log('🔍 CORREÇÃO: Verificando campos de nome disponíveis...');
      console.log('🔍 CORREÇÃO: employee_name:', countingData.employee_name);
      console.log('🔍 CORREÇÃO: created_by:', countingData.created_by);
      
      // PRIORIDADE 1: employee_name (salvo na criação da contagem)
      if (countingData.employee_name && typeof countingData.employee_name === 'string' && countingData.employee_name.trim() !== '') {
        employeeDisplayName = countingData.employee_name.trim();
        console.log('✅ CORREÇÃO: Usando employee_name salvo na criação:', employeeDisplayName);
      }
      // PRIORIDADE 2: Buscar pelo created_by UUID (fallback)
      else if (countingData.created_by) {
        console.log('🔍 CORREÇÃO: employee_name não encontrado, buscando por created_by UUID:', countingData.created_by);
        employeeDisplayName = await fetchUserName(countingData.created_by);
        console.log('✅ CORREÇÃO: Nome obtido via UUID:', employeeDisplayName);
      }
      
      console.log('✅ CORREÇÃO: Nome final do funcionário:', employeeDisplayName);
      setEmployeeName(employeeDisplayName);

      // Extrair ID da contagem para exibição
      const displayId = countingData.internal_id || countingData.id.substring(0, 8);
      setCountingDisplayId(displayId);

      // Verificar prazo da contagem
      const countingDeadline = getCountingDeadline(countingData);
      setDeadline(countingDeadline);
      
      // Verificar se contagem expirou
      const now = new Date();
      if (countingDeadline && now > countingDeadline) {
        console.log('⚠️ MOBILE: Contagem expirada');
        setIsExpired(true);
        setLoading(false);
        return;
      }

      // CORREÇÃO CRÍTICA: Buscar setores com fallback robusto
      let sectorIds: string[] = [];
      console.log('🔍 MOBILE: ===== BUSCANDO SETORES DA CONTAGEM =====');
      console.log('🔍 MOBILE: Tabela:', COUNTING_SECTORS_TABLE);
      console.log('🔍 MOBILE: Counting ID:', countingData.id);
      
      try {
        const { data: sectorRelations, error: sectorError } = await supabase
          .from(COUNTING_SECTORS_TABLE)
          .select('sector_id')
          .eq('counting_id', countingData.id);
        
        console.log('🔍 MOBILE: Resultado da consulta de setores:', { 
          data: sectorRelations, 
          error: sectorError,
          length: sectorRelations?.length || 0 
        });
        
        if (!sectorError && sectorRelations && sectorRelations.length > 0) {
          sectorIds = sectorRelations.map(relation => relation.sector_id);
          console.log('✅ MOBILE: Setores específicos encontrados:', sectorIds);
        } else if (sectorError) {
          console.log('❌ MOBILE: Erro ao buscar setores específicos:', sectorError.message);
        } else {
          console.log('⚠️ MOBILE: Nenhum setor específico encontrado');
        }
        
      } catch (e) {
        console.log('❌ MOBILE: Exceção ao buscar setores específicos:', e);
      }

      // FALLBACK ROBUSTO: Se nenhum setor específico, carregar todos da empresa
      let finalSectorIds = sectorIds;
      if (sectorIds.length === 0) {
        console.log('🔄 MOBILE: APLICANDO FALLBACK - Carregando todos os setores da empresa');
        try {
          const { data: allSectors, error: allSectorsError } = await supabase
            .from(TABLES.SECTORS)
            .select('id')
            .eq('company_id', countingData.company_id);
          
          if (!allSectorsError && allSectors && allSectors.length > 0) {
            finalSectorIds = allSectors.map(s => s.id);
            console.log('✅ MOBILE: FALLBACK aplicado - Todos os setores da empresa:', finalSectorIds);
          } else {
            console.log('❌ MOBILE: FALLBACK falhou:', allSectorsError?.message);
          }
        } catch (fallbackError) {
          console.log('❌ MOBILE: Exceção no fallback:', fallbackError);
        }
      }

      console.log('🏗️ MOBILE: Setores finais para a contagem:', finalSectorIds);

      const foundCounting: Counting = {
        id: countingData.id,
        internalId: countingData.internal_id || countingData.id.substring(0, 8),
        name: countingData.name,
        description: countingData.description,
        companyId: countingData.company_id,
        createdBy: employeeDisplayName, // CORREÇÃO: Usar nome real em vez de UUID
        status: countingData.status,
        shareLink: countingData.mobile_link,
        createdAt: countingData.created_at,
        updatedAt: countingData.updated_at
      };

      setCounting(foundCounting);

      // Carregar dados da empresa
      try {
        const { data: companyData, error: companyError } = await supabase
          .from(TABLES.COMPANIES)
          .select('name')
          .eq('id', foundCounting.companyId)
          .single();
        
        if (!companyError && companyData) {
          setCompanyName(companyData.name);
        }
      } catch (companyError) {
        console.log('⚠️ MOBILE: Erro ao carregar empresa:', companyError);
      }

      // CORREÇÃO: Carregar setores para o dropdown com fallback
      let mappedSectors: Sector[] = [];
      if (finalSectorIds.length > 0) {
        console.log('🔍 MOBILE: Carregando dados dos setores para dropdown...');
        const { data: sectorsData, error: sectorsError } = await supabase
          .from(TABLES.SECTORS)
          .select('*')
          .in('id', finalSectorIds);
        
        console.log('🔍 MOBILE: Resultado da consulta de setores:', { 
          data: sectorsData, 
          error: sectorsError,
          length: sectorsData?.length || 0 
        });
        
        if (!sectorsError && sectorsData) {
          mappedSectors = sectorsData.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            companyId: s.company_id,
            createdAt: s.created_at,
            updatedAt: s.updated_at
          }));
        }
        console.log('✅ MOBILE: Setores do dropdown carregados:', mappedSectors.length);
      } else {
        console.log('⚠️ MOBILE: Nenhum setor disponível para dropdown');
      }
      
      setSectors(mappedSectors);

      // CORREÇÃO: Carregar produtos com fallback
      let productsQuery = supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('company_id', foundCounting.companyId);

      // Filtrar por setores APENAS se setores foram definidos
      if (finalSectorIds.length > 0) {
        console.log('🎯 MOBILE: Filtrando produtos por setores:', finalSectorIds);
        productsQuery = productsQuery.in('sector_id', finalSectorIds);
      } else {
        console.log('⚠️ MOBILE: Carregando TODOS os produtos da empresa (sem filtro de setor)');
      }

      const { data: productsData, error: productsError } = await productsQuery;
      
      console.log('🔍 MOBILE: Resultado da consulta de produtos:', { 
        data: productsData?.length || 0, 
        error: productsError,
        filteredBySectors: finalSectorIds.length > 0 
      });
      
      if (productsError) {
        console.error('❌ MOBILE: Erro ao carregar produtos:', productsError);
        throw new Error(`Erro ao carregar produtos: ${productsError.message}`);
      }
      
      const mappedProducts = (productsData || []).map(p => ({
        id: p.id,
        name: safeString(p.name),
        code: safeString(p.code),
        description: p.description,
        categoryId: p.category_id,
        sectorId: p.sector_id,
        unit: p.unit,
        conversionFactor: p.conversion_factor || 1,
        alternativeUnit: p.alternative_unit,
        minStock: p.min_stock,
        maxStock: p.max_stock,
        currentStock: p.current_stock || 0,
        unitCost: p.unit_cost,
        companyId: p.company_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      
      setProducts(mappedProducts);
      console.log('✅ MOBILE: Produtos carregados:', mappedProducts.length);

      // Carregar itens contados
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .select('*')
          .eq('counting_id', foundCounting.id);
        
        if (!itemsError && itemsData) {
          const mappedItems = itemsData.map(item => ({
            id: item.id,
            countingId: item.counting_id,
            productId: item.product_id,
            quantity: item.counted_quantity || item.quantity || 0,
            notes: item.notes,
            createdAt: item.created_at,
            updatedAt: item.updated_at
          }));
          setCountingItems(mappedItems);
          
          // Inicializar inputs de quantidade com valores existentes
          const initialQuantityInputs: {[productId: string]: string} = {};
          mappedItems.forEach(item => {
            const product = mappedProducts.find(p => p.id === item.productId);
            if (product) {
              const unit = getProductUnit(product);
              initialQuantityInputs[item.productId] = formatQuantityForDisplay(item.quantity, unit);
            }
          });
          setQuantityInputs(initialQuantityInputs);
          
          console.log('✅ MOBILE: Itens contados carregados:', mappedItems.length);
        } else {
          setCountingItems([]);
        }
      } catch (itemsError) {
        console.log('⚠️ MOBILE: Erro ao carregar itens contados:', itemsError);
        setCountingItems([]);
      }

      console.log('🎉 MOBILE: ===== TODOS OS DADOS CARREGADOS COM SUCESSO =====');
      console.log('📊 MOBILE: Resumo:');
      console.log('  - Nome do funcionário:', employeeDisplayName);
      console.log('  - Setores no dropdown:', mappedSectors.length);
      console.log('  - Produtos disponíveis:', mappedProducts.length);
      console.log('  - Itens já contados:', countingItems.length);

    } catch (error) {
      console.error('❌ MOBILE: Error loading counting data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados';
      setError(`Erro ao carregar dados da contagem: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const saveProductQuantity = async (productId: string, quantity: number) => {
    if (!counting) {
      console.error('❌ Counting não existe');
      return;
    }

    console.log('💾 Salvando produto:', { productId, quantity, countingId: counting.id });
    setSavingItems(prev => new Set(prev).add(productId));

    try {
      // Check Supabase connection before saving
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) {
        throw new Error('Erro de conexão com o banco de dados');
      }

      const existingItem = countingItems.find(item => item.productId === productId);
      
      if (existingItem && !existingItem.id.startsWith('temp-')) {
        // Update existing item
        const { data, error } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .update({ 
            counted_quantity: quantity, 
            quantity: quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao atualizar item:', error);
          throw new Error(`Erro ao atualizar item: ${error.message}`);
        }
        
        setCountingItems(prev => 
          prev.map(item => 
            item.id === existingItem.id 
              ? { ...item, quantity: quantity }
              : item
          )
        );
      } else {
        // Create new item - CORREÇÃO: Usar INSERT simples
        const newItem = {
          counting_id: counting.id,
          product_id: productId,
          counted_quantity: quantity,
          quantity: quantity,
          notes: null,
          counted_by: counting.createdBy,
          counted_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .insert(newItem)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao criar item:', error);
          throw new Error(`Erro ao criar item: ${error.message}`);
        }
        
        const mappedItem: CountingItem = {
          id: data.id,
          countingId: data.counting_id,
          productId: data.product_id,
          quantity: data.counted_quantity || data.quantity,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        setCountingItems(prev => {
          const filtered = prev.filter(item => item.productId !== productId || !item.id.startsWith('temp-'));
          return [...filtered, mappedItem];
        });
      }
      
      console.log('🎉 Produto salvo com sucesso!');
      showToast('Produto salvo com sucesso!', 'success');
      
    } catch (error) {
      console.error('❌ Error saving quantity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao salvar: ${errorMessage}`, 'error');
    } finally {
      setSavingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const quantity = Math.max(0, newQuantity);
    
    setCountingItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === productId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: quantity };
        return updated;
      } else {
        return [...prev, {
          id: `temp-${productId}`,
          countingId: counting?.id || '',
          productId: productId,
          quantity: quantity,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
    });
    
    // Atualizar também o input de quantidade
    const product = products.find(p => p.id === productId);
    if (product) {
      const unit = getProductUnit(product);
      const displayValue = formatQuantityForDisplay(quantity, unit);
      setQuantityInputs(prev => ({
        ...prev,
        [productId]: displayValue
      }));
    }
  };

  const getProductQuantity = (productId: string): number => {
    const item = countingItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  // RESTAURADO: Função para atualizar input da calculadora
  const updateCalculatorInput = (productId: string, value: string) => {
    // Aceitar números e vírgula para calculadora
    const cleanValue = value.replace(/[^0-9,]/g, '');
    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      const processedValue = parts[0] + ',' + parts.slice(1).join('');
      setCalculatorInputs(prev => ({
        ...prev,
        [productId]: processedValue
      }));
    } else {
      setCalculatorInputs(prev => ({
        ...prev,
        [productId]: cleanValue
      }));
    }
  };

  // RESTAURADO: Função para calcular e usar resultado da calculadora
  const calculateAndUse = (productId: string, conversionFactor: number) => {
    const boxQuantityStr = calculatorInputs[productId] || '0';
    const boxQuantity = parseDecimalInput(boxQuantityStr);
    const calculatedUnits = boxQuantity * conversionFactor;
    
    // Atualizar quantidade do produto
    updateQuantity(productId, calculatedUnits);
    
    // Limpar input da calculadora
    setCalculatorInputs(prev => ({
      ...prev,
      [productId]: ''
    }));
    
    // Mostrar feedback
    const productUnit = getProductUnit(products.find(p => p.id === productId) || {} as Product);
    const formattedBoxQuantity = boxQuantityStr.includes(',') ? boxQuantityStr : boxQuantity.toString();
    const formattedResult = calculatedUnits.toString().replace('.', ',');
    showToast(`${formattedBoxQuantity} caixas = ${formattedResult} ${productUnit}`, 'success');
  };

  const filteredProducts = products.filter(product => {
    try {
      const searchLower = safeString(searchTerm).toLowerCase();
      const productName = safeString(product.name).toLowerCase();
      const productCode = safeString(product.code).toLowerCase();
      
      const matchesSearch = !searchTerm || 
        productName.includes(searchLower) ||
        productCode.includes(searchLower);
      
      const matchesSector = !selectedSector || product.sectorId === selectedSector;
      
      return matchesSearch && matchesSector;
    } catch (error) {
      console.error('❌ Error filtering product:', product, error);
      return false;
    }
  });

  const saveForLater = async () => {
    if (!counting) {
      console.error('❌ Counting não existe para salvar progresso');
      return;
    }

    console.log('💾 Salvando progresso para mais tarde...');
    setSavingProgress(true);

    try {
      // Check Supabase connection
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) {
        throw new Error('Erro de conexão com o banco de dados');
      }

      // CORREÇÃO: Verificar itens existentes antes de inserir
      const itemsToSave = countingItems.filter(item => item.quantity > 0);
      
      if (itemsToSave.length > 0) {
        // Buscar itens existentes
        const { data: existingItems } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .select('counting_id, product_id, id')
          .eq('counting_id', counting.id);

        const existingMap = new Map();
        (existingItems || []).forEach(item => {
          existingMap.set(item.product_id, item.id);
        });

        // Separar itens para inserir e atualizar
        const itemsToInsert = [];
        const itemsToUpdate = [];

        itemsToSave.forEach(item => {
          const itemData = {
            counting_id: counting.id,
            product_id: item.productId,
            counted_quantity: item.quantity,
            quantity: item.quantity,
            notes: item.notes,
            counted_by: counting.createdBy,
            counted_at: new Date().toISOString()
          };

          if (existingMap.has(item.productId)) {
            itemsToUpdate.push({
              ...itemData,
              id: existingMap.get(item.productId)
            });
          } else {
            itemsToInsert.push(itemData);
          }
        });

        // Inserir novos itens
        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .insert(itemsToInsert);

          if (insertError) {
            console.error('❌ Erro ao inserir novos itens:', insertError);
            throw new Error(`Erro ao inserir itens: ${insertError.message}`);
          }
        }

        // Atualizar itens existentes
        for (const item of itemsToUpdate) {
          const { error: updateError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .update({
              counted_quantity: item.counted_quantity,
              quantity: item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar item:', updateError);
            throw new Error(`Erro ao atualizar item: ${updateError.message}`);
          }
        }

        console.log('✅ Itens salvos com sucesso');
      }

      // Update counting status
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', counting.id);
      
      if (error) {
        console.error('❌ Erro ao salvar progresso:', error);
        throw new Error(`Erro ao salvar progresso: ${error.message}`);
      }
      
      showToast('Progresso salvo com sucesso! Você pode continuar mais tarde.', 'success');
      
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao salvar progresso: ${errorMessage}`, 'error');
    } finally {
      setSavingProgress(false);
    }
  };

  const completeCounting = async () => {
    if (!counting) {
      console.error('❌ Counting não existe para finalizar');
      return;
    }

    console.log('🏁 Finalizando contagem...');
    setCompletingCounting(true);

    try {
      // Check Supabase connection
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) {
        throw new Error('Erro de conexão com o banco de dados');
      }

      // CORREÇÃO: Mesmo processo de salvamento sem ON CONFLICT
      const itemsToSave = countingItems.filter(item => item.quantity > 0);
      
      if (itemsToSave.length > 0) {
        // Buscar itens existentes
        const { data: existingItems } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .select('counting_id, product_id, id')
          .eq('counting_id', counting.id);

        const existingMap = new Map();
        (existingItems || []).forEach(item => {
          existingMap.set(item.product_id, item.id);
        });

        // Separar itens para inserir e atualizar
        const itemsToInsert = [];
        const itemsToUpdate = [];

        itemsToSave.forEach(item => {
          const itemData = {
            counting_id: counting.id,
            product_id: item.productId,
            counted_quantity: item.quantity,
            quantity: item.quantity,
            notes: item.notes,
            counted_by: counting.createdBy,
            counted_at: new Date().toISOString()
          };

          if (existingMap.has(item.productId)) {
            itemsToUpdate.push({
              ...itemData,
              id: existingMap.get(item.productId)
            });
          } else {
            itemsToInsert.push(itemData);
          }
        });

        // Inserir novos itens
        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .insert(itemsToInsert);

          if (insertError) {
            console.error('❌ Erro ao inserir itens finais:', insertError);
            throw new Error(`Erro ao inserir itens: ${insertError.message}`);
          }
        }

        // Atualizar itens existentes
        for (const item of itemsToUpdate) {
          const { error: updateError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .update({
              counted_quantity: item.counted_quantity,
              quantity: item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar item final:', updateError);
            throw new Error(`Erro ao atualizar item: ${updateError.message}`);
          }
        }

        console.log('✅ Itens finais salvos com sucesso');
      }

      // Update counting status to completed
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', counting.id);
      
      if (error) {
        console.error('❌ Erro ao finalizar contagem:', error);
        throw new Error(`Erro ao finalizar contagem: ${error.message}`);
      }
      
      setCounting(prev => prev ? {
        ...prev,
        status: 'completed'
      } : null);
      
      showToast('Contagem finalizada com sucesso!', 'success');
      
    } catch (error) {
      console.error('❌ Error completing counting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao finalizar contagem: ${errorMessage}`, 'error');
    } finally {
      setCompletingCounting(false);
    }
  };

  // Calcular progresso
  const totalProducts = filteredProducts.length;
  const filledProducts = countingItems.filter(item => 
    filteredProducts.some(product => product.id === item.productId) && item.quantity > 0
  ).length;
  const remainingProducts = totalProducts - filledProducts;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contagem...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contagem Expirada</h2>
          <p className="text-gray-600 mb-4">
            Esta contagem expirou e não pode mais ser preenchida.
          </p>
          {deadline && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2 font-medium">
                Prazo expirado em:
              </p>
              <p className="text-lg font-semibold text-red-900">
                {formatDeadline(deadline)}
              </p>
            </div>
            )}
          <p className="text-sm text-gray-500">
            Para reativar esta contagem, entre em contato com o BPO.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Erro</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadCountingData();
            }}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!counting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contagem não encontrada</h2>
          <p className="text-gray-600">A contagem solicitada não foi encontrada.</p>
        </div>
      </div>
    );
  }

  // Check if counting is approved - NEW VALIDATION
  if (counting && isCountingApproved(counting.status)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md border border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contagem Aprovada</h2>
          <p className="text-gray-600 mb-4">
            Esta contagem foi finalizada e aprovada. Caso necessário, uma nova contagem deve ser criada.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 mb-2 font-medium">
              Status:
            </p>
            <p className="text-lg font-semibold text-green-900 capitalize">
              {counting.status}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Entre em contato com o BPO para criar uma nova contagem se necessário.
          </p>
        </div>
      </div>
    );
  }

  if (counting.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md border border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contagem Finalizada</h2>
          <p className="text-gray-600 mb-2">
            A contagem foi enviada ao painel e está concluída.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Obrigado, {employeeName}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      {showSuccessToast && (
        <Toast 
          message={toastMessage} 
          type="success" 
          onClose={() => setShowSuccessToast(false)} 
        />
      )}
      {showSaveToast && (
        <Toast 
          message={toastMessage} 
          type="error" 
          onClose={() => setShowSaveToast(false)} 
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          {/* ID da Contagem */}
          <div className="text-center mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              ID: {countingDisplayId}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Preencher contagem de estoque
          </h1>
          <p className="text-lg text-gray-700 mb-1 text-center">
            Olá {employeeName}
          </p>
          <p className="text-sm text-gray-600 mb-4 text-center">
            DA EMPRESA: {companyName.toUpperCase()}
          </p>
          
          {/* Deadline and Time Remaining - Only show if deadline exists */}
          {deadline && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Prazo: {formatDeadline(deadline)}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className={`text-sm font-medium ${getTimeRemainingColor()}`}>
                  Tempo restante: {timeRemaining || 'Calculando...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-blue-50 border-b px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">Progresso da Contagem</span>
          <span className="text-sm text-blue-700">{filledProducts}/{totalProducts}</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalProducts > 0 ? (filledProducts / totalProducts) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-blue-700">
          <span>Preenchidos: {filledProducts}</span>
          <span>Faltantes: {remainingProducts}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os setores</option>
            {sectors.map(sector => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
          {/* INDICADOR DE STATUS DO FILTRO */}
          {sectors.length === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Filtro de setores indisponível - mostrando todos os produtos
            </div>
          )}
        </div>
      </div>

      {/* Products Feed */}
      <div className="pb-32">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Tente ajustar sua busca' : 'Não há produtos disponíveis para contagem'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {filteredProducts.map((product) => {
              const quantity = getProductQuantity(product.id);
              const isSaving = savingItems.has(product.id);
              const boxQuantityStr = calculatorInputs[product.id] || '';
              const boxQuantity = parseDecimalInput(boxQuantityStr);
              const calculatedUnits = boxQuantity * product.conversionFactor;
              const productUnit = getProductUnit(product);
              
              // Usar valor do input de quantidade
              const quantityInputValue = quantityInputs[product.id] || (quantity === 0 ? '' : formatQuantityForDisplay(quantity, productUnit));
              
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-base text-gray-500 font-bold mb-2">
                          CÓDIGO: {product.code || 'N/A'}
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                          {product.name}
                        </h3>
                      </div>
                    </div>
                    
                    {/* RESTAURADO: Calculadora de Conversão */}
                    {product.conversionFactor > 1 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg">🧮</span>
                          <h4 className="text-sm font-semibold text-blue-900">
                            CALCULADORA DE CONVERSÃO
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="text-sm text-blue-800">
                            Digite quantas caixas/embalagens:
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-wrap">
                            <input 
                              type="text"
                              inputMode="text"
                              placeholder=""
                              value={boxQuantityStr}
                              onChange={(e) => updateCalculatorInput(product.id, e.target.value)}
                              className="w-16 px-2 py-2 border border-blue-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-blue-900 font-medium">×</span>
                            <span className="font-medium text-blue-900">{product.conversionFactor}</span>
                            <span className="text-blue-900 font-medium">=</span>
                            <span className="font-bold text-blue-900">
                              {calculatedUnits.toString().replace('.', ',')} {productUnit}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => calculateAndUse(product.id, product.conversionFactor)}
                            disabled={boxQuantity === 0}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium transition-colors"
                          >
                            CALCULAR E USAR
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Gramatura:</span>
                        <p className="font-medium text-gray-900">{product.unit || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fator conversão:</span>
                        <p className="font-medium text-gray-900">{product.conversionFactor}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="mb-4">
                        <span className="text-base font-bold text-gray-900">Quantidade:</span>
                        {allowsFractionalInput(productUnit) ? (
                          <span className="text-xs text-green-600 ml-2">(aceita vírgula)</span>
                        ) : (
                          <span className="text-xs text-orange-600 ml-2">(apenas números inteiros)</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        {/* Minus Button */}
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-12 h-12 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center touch-manipulation transition-colors"
                          disabled={counting.status === 'completed'}
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        
                        {/* FOCO: Campo de quantidade com vírgula */}
                        <input
                          type="text"
                          inputMode="decimal"
                          value={quantityInputValue}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            
                            if (!allowsFractionalInput(productUnit)) {
                              // Para unidades que não permitem vírgula, remover vírgulas e pontos
                              const integerValue = inputValue.replace(/[^0-9]/g, '');
                              setQuantityInputs(prev => ({
                                ...prev,
                                [product.id]: integerValue
                              }));
                              const numericValue = parseInt(integerValue) || 0;
                              updateQuantity(product.id, numericValue);
                            } else {
                              // Para outras unidades, aceitar vírgula
                              const cleanValue = inputValue.replace(/[^0-9,]/g, '');
                              const parts = cleanValue.split(',');
                              let processedValue = cleanValue;
                              if (parts.length > 2) {
                                processedValue = parts[0] + ',' + parts.slice(1).join('');
                              }
                              
                              setQuantityInputs(prev => ({
                                ...prev,
                                [product.id]: processedValue
                              }));
                              
                              const numericValue = parseDecimalInput(processedValue);
                              updateQuantity(product.id, numericValue);
                            }
                          }}
                          className="w-20 px-3 py-3 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                        
                        {/* Plus Button */}
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-12 h-12 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center touch-manipulation transition-colors"
                          disabled={counting.status === 'completed'}
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {/* Save Button - Centered and Larger */}
                      <button
                        onClick={() => saveProductQuantity(product.id, quantity)}
                        disabled={isSaving}
                        className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-semibold transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Salvar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
        <button
          onClick={saveForLater}
          disabled={savingProgress}
          className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-colors"
        >
          {savingProgress ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Salvando progresso...</span>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5" />
              <span>Salvar para continuar mais tarde</span>
            </>
          )}
        </button>
        <button
          onClick={completeCounting}
          disabled={completingCounting}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-colors"
        >
          {completingCounting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Finalizando contagem...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Finalizar Contagem</span>
            </>
          )}
        </button>
      </div>
      
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CountingMobile;