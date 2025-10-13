import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Save, CheckCircle, Clock, Package, AlertTriangle, Plus, Minus, Calendar, X, FileText, XCircle } from 'lucide-react';
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

  // ========== NOVOS ESTADOS ==========
  // 1. Drawer de filtros
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  
  // 2. Modal de observações finais
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [finalNotes, setFinalNotes] = useState('');
  
  // 3. Produtos indisponíveis ("Não tem")
  const [unavailableProducts, setUnavailableProducts] = useState<Set<string>>(new Set());
  
  // 4. Filtro de status expandido
  const [filterStatus, setFilterStatus] = useState<'all' | 'uncounted' | 'unavailable'>('all');
  
  const [calculatorInputs, setCalculatorInputs] = useState<{[productId: string]: string}>({});
  const [quantityInputs, setQuantityInputs] = useState<{[productId: string]: string}>({});

  const COUNTING_ITEMS_TABLE = 'app_0bcfd220f3_counting_items';
  const COUNTING_SECTORS_TABLE = 'app_0bcfd220f3_counting_sectors';

  const safeString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  const allowsFractionalInput = (unit?: string): boolean => {
    if (!unit) return true;
    const unitUpper = unit.toUpperCase().trim();
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

  const parseDecimalInput = (value: string): number => {
    if (!value || value === '') return 0;
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const isCountingApproved = (status: string): boolean => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus === 'approved' || normalizedStatus === 'aprovada';
  };

  const getProductUnit = (product: Product): string => {
    return product.unit || product.alternativeUnit || 'unidades';
  };

  const formatQuantityForDisplay = (quantity: number, unit: string): string => {
    const allowsFractional = allowsFractionalInput(unit);
    if (allowsFractional) {
      return quantity.toString().replace('.', ',');
    } else {
      return Math.floor(quantity).toString();
    }
  };

  const fetchUserName = async (userId: string): Promise<string> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('name')
        .eq('id', userId)
        .single();
      
      if (userError || !userData || !userData.name) {
        return 'Funcionário Não Identificado';
      }
      return userData.name;
    } catch (error) {
      return 'Funcionário Não Identificado';
    }
  };

  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      if (!supabase) return false;
      const { error } = await supabase.from(TABLES.COMPANIES).select('id').limit(1);
      if (error) return false;
      return true;
    } catch (error) {
      return false;
    }
  };

  // ========== COMPONENTES UI ==========
  
  const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
    <div className={`fixed top-4 left-4 right-4 z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white p-4 rounded-lg shadow-lg flex items-center justify-between animate-slide-down`}>
      <div className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center`}>
          {type === 'success' ? <CheckCircle className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-white" />}
        </div>
        <span className="font-medium">{message}</span>
      </div>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  // NOVO: Drawer de Filtros
  const FilterDrawer = () => (
    <>
      {/* Overlay */}
      {showFilterDrawer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setShowFilterDrawer(false)}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white">
            <h3 className="text-lg font-bold flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </h3>
            <button onClick={() => setShowFilterDrawer(false)} className="hover:bg-blue-700 rounded-full p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Produto
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Setor
              </label>
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
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status do Produto
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${filterStatus === 'all' ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
                >
                  Todos os Produtos
                </button>
                <button
                  onClick={() => setFilterStatus('uncounted')}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${filterStatus === 'uncounted' ? 'border-yellow-600 bg-yellow-50 text-yellow-700 font-semibold' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
                >
                  Não Contados
                </button>
                <button
                  onClick={() => setFilterStatus('unavailable')}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${filterStatus === 'unavailable' ? 'border-red-600 bg-red-50 text-red-700 font-semibold' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
                >
                  Indisponíveis
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('');
                setFilterStatus('all');
              }}
              className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // NOVO: Modal de Observações Finais
  const NotesModal = () => (
    <>
      {showNotesModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowNotesModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Observações Finais</h3>
                </div>
                <button onClick={() => setShowNotesModal(false)} className="hover:bg-blue-700 rounded-full p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-gray-700">
                  Há algo que você gostaria de registrar sobre esta contagem?
                </p>
                
                <textarea
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  placeholder="Ex: Produto X estava em local diferente, Setor Y precisou ser reorganizado, etc..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                
                <p className="text-xs text-gray-500 text-right">
                  {finalNotes.length}/500 caracteres
                </p>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t space-y-3">
                <button
                  onClick={confirmCompleteCounting}
                  disabled={completingCounting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold transition-colors"
                >
                  {completingCounting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Finalizando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirmar Finalização</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowNotesModal(false)}
                  disabled={completingCounting}
                  className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

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

  // ========== FUNÇÕES DE PRODUTOS INDISPONÍVEIS ==========
  
  const markAsUnavailable = async (productId: string) => {
    if (!counting) return;

    try {
      setUnavailableProducts(prev => new Set(prev).add(productId));
      updateQuantity(productId, 0);
      
      const existingItem = countingItems.find(item => item.productId === productId);
      
      const itemData = {
        counting_id: counting.id,
        product_id: productId,
        counted_quantity: 0,
        quantity: 0,
        notes: 'Produto não disponível no momento da contagem',
        is_unavailable: true,
        counted_by: counting.createdBy,
        counted_at: new Date().toISOString()
      };

      if (existingItem && !existingItem.id.startsWith('temp-')) {
        await supabase
          .from(COUNTING_ITEMS_TABLE)
          .update(itemData)
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from(COUNTING_ITEMS_TABLE)
          .insert(itemData);
      }
      
      showToast('Produto marcado como indisponível', 'success');
    } catch (error) {
      console.error('Erro ao marcar produto:', error);
      showToast('Erro ao marcar produto', 'error');
    }
  };

  const unmarkAsUnavailable = async (productId: string) => {
    try {
      setUnavailableProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      
      const existingItem = countingItems.find(item => item.productId === productId);
      if (existingItem && !existingItem.id.startsWith('temp-')) {
        await supabase
          .from(COUNTING_ITEMS_TABLE)
          .update({ 
            is_unavailable: false,
            notes: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);
      }
      
      showToast('Produto desmarcado como indisponível', 'success');
    } catch (error) {
      console.error('Erro ao desmarcar produto:', error);
      showToast('Erro ao desmarcar produto', 'error');
    }
  };

  // ========== EFFECTS ==========
  
  useEffect(() => {
    if (countingId) {
      loadCountingData();
    } else {
      setError('ID da contagem não fornecido');
      setLoading(false);
    }
  }, [countingId]);

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
        
        setTimeRemaining(timeString.trim() || '< 1m');
      };
      
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000);
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
    if (countingData.scheduled_date && countingData.scheduled_time) {
      return new Date(`${countingData.scheduled_date}T${countingData.scheduled_time}`);
    }
    if (countingData.due_date) {
      return new Date(countingData.due_date as string);
    }
    if (countingData.expires_at) {
      return new Date(countingData.expires_at as string);
    }
    const createdAt = new Date(countingData.created_at as string);
    return new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000));
  };

  const loadCountingData = async () => {
    if (!countingId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) {
        throw new Error('Erro de conexão com o banco de dados');
      }
      
      const { data: countingData, error: countingError } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('id', countingId)
        .single();
      
      if (countingError || !countingData) {
        throw new Error('Erro ao carregar contagem');
      }

      let employeeDisplayName = 'Funcionário Não Identificado';
      if (countingData.employee_name && typeof countingData.employee_name === 'string' && countingData.employee_name.trim() !== '') {
        employeeDisplayName = countingData.employee_name.trim();
      } else if (countingData.created_by) {
        employeeDisplayName = await fetchUserName(countingData.created_by);
      }
      setEmployeeName(employeeDisplayName);

      const displayId = countingData.internal_id || countingData.id.substring(0, 8);
      setCountingDisplayId(displayId);

      const countingDeadline = getCountingDeadline(countingData);
      setDeadline(countingDeadline);
      
      if (countingDeadline && new Date() > countingDeadline) {
        setIsExpired(true);
        setLoading(false);
        return;
      }

      let sectorIds: string[] = [];
      try {
        const { data: sectorRelations } = await supabase
          .from(COUNTING_SECTORS_TABLE)
          .select('sector_id')
          .eq('counting_id', countingData.id);
        
        if (sectorRelations && sectorRelations.length > 0) {
          sectorIds = sectorRelations.map(r => r.sector_id);
        }
      } catch (e) {
        console.log('Erro ao buscar setores específicos');
      }

      if (sectorIds.length === 0) {
        const { data: allSectors } = await supabase
          .from(TABLES.SECTORS)
          .select('id')
          .eq('company_id', countingData.company_id);
        
        if (allSectors && allSectors.length > 0) {
          sectorIds = allSectors.map(s => s.id);
        }
      }

      const foundCounting: Counting = {
        id: countingData.id,
        internalId: displayId,
        name: countingData.name,
        description: countingData.description,
        companyId: countingData.company_id,
        createdBy: employeeDisplayName,
        status: countingData.status,
        shareLink: countingData.mobile_link,
        createdAt: countingData.created_at,
        updatedAt: countingData.updated_at
      };

      setCounting(foundCounting);

      const { data: companyData } = await supabase
        .from(TABLES.COMPANIES)
        .select('name')
        .eq('id', foundCounting.companyId)
        .single();
      
      if (companyData) setCompanyName(companyData.name);

      if (sectorIds.length > 0) {
        const { data: sectorsData } = await supabase
          .from(TABLES.SECTORS)
          .select('*')
          .in('id', sectorIds);
        
        if (sectorsData) {
          setSectors(sectorsData.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            companyId: s.company_id,
            createdAt: s.created_at,
            updatedAt: s.updated_at
          })));
        }
      }

      let productsQuery = supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('company_id', foundCounting.companyId);

      if (sectorIds.length > 0) {
        productsQuery = productsQuery.in('sector_id', sectorIds);
      }

      const { data: productsData } = await productsQuery;
      
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

      const { data: itemsData } = await supabase
        .from(COUNTING_ITEMS_TABLE)
        .select('*')
        .eq('counting_id', foundCounting.id);
      
      if (itemsData) {
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
        
        const unavailable = new Set(
          itemsData
            .filter(item => item.is_unavailable === true)
            .map(item => item.product_id)
        );
        setUnavailableProducts(unavailable);
        
        const initialQuantityInputs: {[productId: string]: string} = {};
        mappedItems.forEach(item => {
          const product = mappedProducts.find(p => p.id === item.productId);
          if (product) {
            const unit = getProductUnit(product);
            initialQuantityInputs[item.productId] = formatQuantityForDisplay(item.quantity, unit);
          }
        });
        setQuantityInputs(initialQuantityInputs);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao carregar dados: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const saveProductQuantity = async (productId: string, quantity: number) => {
    if (!counting) return;

    setSavingItems(prev => new Set(prev).add(productId));

    try {
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) throw new Error('Erro de conexão');

      const existingItem = countingItems.find(item => item.productId === productId);
      
      if (existingItem && !existingItem.id.startsWith('temp-')) {
        const { error } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .update({ 
            counted_quantity: quantity, 
            quantity: quantity,
            is_unavailable: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);
        
        if (error) throw new Error(`Erro ao atualizar: ${error.message}`);
        
        setCountingItems(prev => 
          prev.map(item => 
            item.id === existingItem.id ? { ...item, quantity } : item
          )
        );
      } else {
        const newItem = {
          counting_id: counting.id,
          product_id: productId,
          counted_quantity: quantity,
          quantity: quantity,
          is_unavailable: false,
          notes: null,
          counted_by: counting.createdBy,
          counted_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .insert(newItem)
          .select()
          .single();
        
        if (error) throw new Error(`Erro ao criar: ${error.message}`);
        
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
      
      unmarkAsUnavailable(productId);
      showToast('Produto salvo com sucesso!', 'success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro: ${errorMessage}`, 'error');
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
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      } else {
        return [...prev, {
          id: `temp-${productId}`,
          countingId: counting?.id || '',
          productId,
          quantity,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
    });
    
    const product = products.find(p => p.id === productId);
    if (product) {
      const unit = getProductUnit(product);
      setQuantityInputs(prev => ({
        ...prev,
        [productId]: formatQuantityForDisplay(quantity, unit)
      }));
    }
  };

  const getProductQuantity = (productId: string): number => {
    const item = countingItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  const updateCalculatorInput = (productId: string, value: string) => {
    const cleanValue = value.replace(/[^0-9,]/g, '');
    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      const processedValue = parts[0] + ',' + parts.slice(1).join('');
      setCalculatorInputs(prev => ({ ...prev, [productId]: processedValue }));
    } else {
      setCalculatorInputs(prev => ({ ...prev, [productId]: cleanValue }));
    }
  };

  const calculateAndUse = (productId: string, conversionFactor: number) => {
    const boxQuantityStr = calculatorInputs[productId] || '0';
    const boxQuantity = parseDecimalInput(boxQuantityStr);
    const calculatedUnits = boxQuantity * conversionFactor;
    
    updateQuantity(productId, calculatedUnits);
    setCalculatorInputs(prev => ({ ...prev, [productId]: '' }));
    
    const productUnit = getProductUnit(products.find(p => p.id === productId) || {} as Product);
    const formattedResult = calculatedUnits.toString().replace('.', ',');
    showToast(`${boxQuantityStr} caixas = ${formattedResult} ${productUnit}`, 'success');
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
      
      let matchesStatus = true;
      if (filterStatus === 'uncounted') {
        const quantity = getProductQuantity(product.id);
        matchesStatus = quantity === 0 && !unavailableProducts.has(product.id);
      } else if (filterStatus === 'unavailable') {
        matchesStatus = unavailableProducts.has(product.id);
      }
      
      return matchesSearch && matchesSector && matchesStatus;
    } catch (error) {
      return false;
    }
  });

  const saveForLater = async () => {
    if (!counting) return;
    setSavingProgress(true);

    try {
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) throw new Error('Erro de conexão');

      const itemsToSave = countingItems.filter(item => item.quantity > 0);
      
      if (itemsToSave.length > 0) {
        const { data: existingItems } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .select('counting_id, product_id, id')
          .eq('counting_id', counting.id);

        const existingMap = new Map();
        (existingItems || []).forEach(item => {
          existingMap.set(item.product_id, item.id);
        });

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
            itemsToUpdate.push({ ...itemData, id: existingMap.get(item.productId) });
          } else {
            itemsToInsert.push(itemData);
          }
        });

        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .insert(itemsToInsert);
          if (insertError) throw new Error(`Erro ao inserir: ${insertError.message}`);
        }

        for (const item of itemsToUpdate) {
          const { error: updateError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .update({
              counted_quantity: item.counted_quantity,
              quantity: item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          if (updateError) throw new Error(`Erro ao atualizar: ${updateError.message}`);
        }
      }

      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', counting.id);
      
      if (error) throw new Error(`Erro ao salvar: ${error.message}`);
      
      showToast('Progresso salvo! Você pode continuar mais tarde.', 'success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro: ${errorMessage}`, 'error');
    } finally {
      setSavingProgress(false);
    }
  };

  // MODIFICADO: Abrir modal de observações
  const completeCounting = () => {
    setShowNotesModal(true);
  };

  // NOVO: Confirmar finalização com observações
  const confirmCompleteCounting = async () => {
    if (!counting) return;
    setCompletingCounting(true);

    try {
      const supabaseReady = await checkSupabaseConnection();
      if (!supabaseReady) throw new Error('Erro de conexão');

      const itemsToSave = countingItems.filter(item => item.quantity > 0);
      
      if (itemsToSave.length > 0) {
        const { data: existingItems } = await supabase
          .from(COUNTING_ITEMS_TABLE)
          .select('counting_id, product_id, id')
          .eq('counting_id', counting.id);

        const existingMap = new Map();
        (existingItems || []).forEach(item => {
          existingMap.set(item.product_id, item.id);
        });

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
            itemsToUpdate.push({ ...itemData, id: existingMap.get(item.productId) });
          } else {
            itemsToInsert.push(itemData);
          }
        });

        if (itemsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .insert(itemsToInsert);
          if (insertError) throw new Error(`Erro ao inserir: ${insertError.message}`);
        }

        for (const item of itemsToUpdate) {
          const { error: updateError } = await supabase
            .from(COUNTING_ITEMS_TABLE)
            .update({
              counted_quantity: item.counted_quantity,
              quantity: item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          if (updateError) throw new Error(`Erro ao atualizar: ${updateError.message}`);
        }
      }

      // Salvar observações finais
      const updateData: any = { 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (finalNotes.trim()) {
        updateData.final_notes = finalNotes.trim();
      }

      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update(updateData)
        .eq('id', counting.id);
      
      if (error) throw new Error(`Erro ao finalizar: ${error.message}`);
      
      setCounting(prev => prev ? { ...prev, status: 'completed' } : null);
      setShowNotesModal(false);
      showToast('Contagem finalizada com sucesso!', 'success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro: ${errorMessage}`, 'error');
    } finally {
      setCompletingCounting(false);
    }
  };

  const totalProducts = filteredProducts.length;
  const filledProducts = countingItems.filter(item => 
    filteredProducts.some(product => product.id === item.productId) && item.quantity > 0
  ).length;
  const remainingProducts = totalProducts - filledProducts;

  // ========== LOADING & ERROR STATES ==========

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
          <p className="text-gray-600 mb-4">Esta contagem expirou e não pode mais ser preenchida.</p>
          {deadline && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2 font-medium">Prazo expirado em:</p>
              <p className="text-lg font-semibold text-red-900">{formatDeadline(deadline)}</p>
            </div>
          )}
          <p className="text-sm text-gray-500">Para reativar esta contagem, entre em contato com o BPO.</p>
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

  if (counting && isCountingApproved(counting.status)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md border border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contagem Aprovada</h2>
          <p className="text-gray-600 mb-4">Esta contagem foi finalizada e aprovada. Caso necessário, uma nova contagem deve ser criada.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 mb-2 font-medium">Status:</p>
            <p className="text-lg font-semibold text-green-900 capitalize">{counting.status}</p>
          </div>
          <p className="text-sm text-gray-500">Entre em contato com o BPO para criar uma nova contagem se necessário.</p>
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
          <p className="text-gray-600 mb-2">A contagem foi enviada ao painel e está concluída.</p>
          <p className="text-sm text-gray-500 mb-6">Obrigado, {employeeName}!</p>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
const getProductStatus = (productId: string): 'counted' | 'uncounted' | 'unavailable' => {
  if (unavailableProducts.has(productId)) return 'unavailable';
  const quantity = getProductQuantity(productId);
  return quantity > 0 ? 'counted' : 'uncounted';
};


  return (
    <div className="min-h-screen bg-gray-50">
      {showSuccessToast && (
        <Toast message={toastMessage} type="success" onClose={() => setShowSuccessToast(false)} />
      )}
      {showSaveToast && (
        <Toast message={toastMessage} type="error" onClose={() => setShowSaveToast(false)} />
      )}

      <FilterDrawer />
      <NotesModal />

      {/* BOTÃO FLUTUANTE DE FILTROS */}
      <button
        onClick={() => setShowFilterDrawer(true)}
        className="fixed top-20 right-4 z-30 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110"
        aria-label="Abrir filtros"
      >
        <Filter className="w-6 h-6" />
      </button>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <div className="text-center mb-3">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              ID: {countingDisplayId}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Preencher contagem de estoque
          </h1>
          <p className="text-lg text-gray-700 mb-1 text-center">Olá {employeeName}</p>
          <p className="text-sm text-gray-600 mb-4 text-center">DA EMPRESA: {companyName.toUpperCase()}</p>
          
          {deadline && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Prazo: {formatDeadline(deadline)}</span>
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
              const isUnavailable = unavailableProducts.has(product.id);
              const boxQuantityStr = calculatorInputs[product.id] || '';
              const boxQuantity = parseDecimalInput(boxQuantityStr);
              const calculatedUnits = boxQuantity * product.conversionFactor;
              const productUnit = getProductUnit(product);
              const quantityInputValue = quantityInputs[product.id] || (quantity === 0 ? '' : formatQuantityForDisplay(quantity, productUnit));
              
              return (
                <div key={product.id} className={`bg-white rounded-lg shadow-sm border p-4 ${isUnavailable ? 'border-red-300 bg-red-50' : ''}`}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xl font-bold text-gray-500 leading-tight mb-2">CÓDIGO: {product.code || 'N/A'}</p>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{product.name}</h3>
                        {isUnavailable && (
                          <span className="inline-block bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                            INDISPONÍVEL
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {product.conversionFactor > 1 && !isUnavailable && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg">🧮</span>
                          <h4 className="text-sm font-semibold text-blue-900">CALCULADORA DE CONVERSÃO</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm text-blue-800">Digite quantas caixas/embalagens:</div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <input 
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
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
                        <span className="text-xl font-bold text-gray-900 leading-tight mb-2">Gramatura:</span>
                        <p className="text-xl font-bold text-gray-900 leading-tight mb-2">{product.unit || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-xl font-bold text-gray-900 leading-tight mb-2">Fator conversão:</span>
                        <p className="text-xl font-bold text-gray-900 leading-tight mb-2">{product.conversionFactor}</p>
                      </div>
                    </div>
                    
                    {!isUnavailable ? (
                      <div className="border-t pt-4">
                        <div className="mb-4">
                          <span className="text-xl font-bold text-gray-900 leading-tight mb-2">Quantidade:</span>
                          {allowsFractionalInput(productUnit) ? (
                            <span className="text-xl font-bold text-green-600 leading-tight mb-2">(aceita vírgula)</span>
                          ) : (
                            <span className="text-xl font-bold text-orange-600 leading-tight mb-2">(apenas números inteiros)</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center space-x-3 mb-4">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="w-12 h-12 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center touch-manipulation transition-colors"
                          >
                            <Minus className="w-6 h-6" />
                          </button>
                          
                          <input
                            type="text"
                            inputMode="decimal"
                            value={quantityInputValue}
                            onChange={(e) => {
                              setQuantityInputs(prev => ({ ...prev, [product.id]: e.target.value }));
                            }}
                            onBlur={(e) => {
                              const inputValue = e.target.value;
                              let processedValue = inputValue;
                              
                              if (!allowsFractionalInput(productUnit)) {
                                processedValue = inputValue.replace(/[^0-9]/g, '');
                              } else {
                                processedValue = inputValue.replace(/[^0-9,]/g, '');
                                const parts = processedValue.split(',');
                                if (parts.length > 2) {
                                  processedValue = parts[0] + ',' + parts.slice(1).join('');
                                }
                              }
                              
                              setQuantityInputs(prev => ({ ...prev, [product.id]: processedValue }));
                              const numericValue = parseDecimalInput(processedValue);
                              updateQuantity(product.id, numericValue);
                            }}
                            className="w-20 px-3 py-3 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-12 h-12 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center touch-manipulation transition-colors"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
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
                          
                          <button
                            onClick={() => markAsUnavailable(product.id)}
                            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 font-medium transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                            <span>Não Tem</span>
                          </button>
                        </div>
                      </div>
                      
                    ) : (
                      <div className="border-t pt-4">
                        <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                          <p className="text-red-800 text-sm font-medium text-center">
                            Este produto foi marcado como indisponível
                          </p>
                        </div>
                        <button
                          onClick={() => unmarkAsUnavailable(product.id)}
                          className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 font-medium transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Marcar como Disponível</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3 shadow-lg">
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
      
      <style>{`
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