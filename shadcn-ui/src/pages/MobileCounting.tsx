import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Save, CheckCircle, Clock, AlertCircle, Plus, Minus, RotateCcw } from 'lucide-react';
import { format, isAfter, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../lib/database';
import type { Counting, Sector, Product, CountingItem } from '../lib/types';

interface CountingWithDetails extends Counting {
  company_name?: string;
  sectors?: Sector[];
  items?: (CountingItem & { product?: Product })[];
  products?: Product[];
}

const MobileCounting: React.FC = () => {
  const { countingId } = useParams<{ countingId: string }>();
  const [counting, setCounting] = useState<CountingWithDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [countedItems, setCountedItems] = useState<{ [productId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (countingId) {
      loadCountingData();
    }
  }, [countingId]);

  const loadCountingData = async () => {
    if (!countingId) return;

    try {
      setLoading(true);
      console.log('🔄 Loading counting data for mobile:', countingId);
      
      // Load counting details - search through all companies
      const companies = await db.getCompaniesAsync();
      let countingData: CountingWithDetails | null = null;
      
      for (const company of companies) {
        const countings = await db.getCountingsAsync(company.id);
        const foundCounting = countings.find(c => c.id === countingId);
        if (foundCounting) {
          countingData = {
            ...foundCounting,
            company_name: company.name
          };
          break;
        }
      }
      
      if (!countingData) {
        throw new Error('Counting not found');
      }
      
      console.log('✅ Counting data loaded:', countingData);
      setCounting(countingData);
      
      // Check expiration logic
      console.log('🔍 Checking expiration logic:');
      console.log('- Status:', countingData.status);
      console.log('- ExpiresAt:', countingData.expiresAt);
      
      if (countingData.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(countingData.expiresAt);
        
        console.log('- Current time:', now.toISOString());
        console.log('- Expires at:', expiresAt.toISOString());
        
        const canExpire = countingData.status === 'in_progress' || countingData.status === 'pending';
        const isTimeExpired = now > expiresAt;
        const shouldShowExpired = canExpire && isTimeExpired;
        
        console.log('- Should show expired:', shouldShowExpired);
        setIsExpired(shouldShowExpired);
      } else {
        console.log('- No expiration date set');
        setIsExpired(false);
      }

      // Load products for the sectors in this counting
      if (countingData.sectorIds && countingData.sectorIds.length > 0) {
        const allProducts = await db.getProductsAsync(countingData.companyId);
        const sectorProducts = allProducts.filter(p => countingData.sectorIds?.includes(p.sector_id || ''));
        console.log('✅ Products loaded:', sectorProducts);
        setProducts(sectorProducts);
      }

      // Initialize empty counted items for now
      setCountedItems({});

    } catch (error) {
      console.error('❌ Error loading counting data:', error);
      alert('Erro ao carregar dados da contagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (productId: string, quantity: number) => {
    if (!countingId || !counting) return;

    try {
      setSaving(true);
      console.log('🔄 Saving product count:', { countingId, productId, quantity });
      
      // Update local state for now
      setCountedItems(prev => ({
        ...prev,
        [productId]: quantity
      }));

      // Move to next product
      if (currentProductIndex < filteredProducts.length - 1) {
        setCurrentProductIndex(currentProductIndex + 1);
      }

      console.log('✅ Product count saved successfully');
    } catch (error) {
      console.error('❌ Error saving product count:', error);
      const errorMessage = (error as Error)?.message || 'Erro desconhecido ao salvar';
      alert(`Erro ao salvar contagem do produto: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const input = document.getElementById(`quantity-${productId}`) as HTMLInputElement;
    const currentValue = parseFloat(input.value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    input.value = newValue.toString();
  };

  const handleFinalizeCounting = async () => {
    if (!countingId || !counting) return;
    
    if (!confirm('Tem certeza que deseja finalizar esta contagem? Esta ação não pode ser desfeita.')) return;

    try {
      setSaving(true);
      console.log('🔄 Finalizing counting:', countingId);
      
      const updatedCounting = {
        ...counting,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      };
      
      await db.saveCountingAsync(updatedCounting);
      
      alert('Contagem finalizada com sucesso!');
      window.location.reload();
      
      console.log('✅ Counting finalized successfully');
    } catch (error) {
      console.error('❌ Error finalizing counting:', error);
      alert('Erro ao finalizar contagem.');
    } finally {
      setSaving(false);
    }
  };

  const handleReopenCounting = async () => {
    if (!countingId || !counting) return;
    
    if (!confirm('Tem certeza que deseja reabrir esta contagem?')) return;

    try {
      setSaving(true);
      console.log('🔄 Reopening counting:', countingId);
      
      const newExpiration = new Date();
      newExpiration.setHours(newExpiration.getHours() + 2);
      
      const updatedCounting = {
        ...counting,
        status: 'in_progress' as const,
        expiresAt: newExpiration.toISOString()
      };
      
      await db.saveCountingAsync(updatedCounting);
      
      alert('Contagem reaberta com sucesso! Você tem mais 2 horas para completar.');
      window.location.reload();
      
      console.log('✅ Counting reopened successfully');
    } catch (error) {
      console.error('❌ Error reopening counting:', error);
      alert('Erro ao reabrir contagem.');
    } finally {
      setSaving(false);
    }
  };

  const formatConversionDisplay = (product: Product) => {
    if (product.alternativeUnit && product.alternativeUnit.trim() !== '') {
      const factor = product.conversionFactor || 1;
      return `1 ${product.alternativeUnit} = ${factor} ${product.unit}`;
    }
    return null;
  };

  const getRemainingTime = () => {
    if (!counting?.expiresAt) return null;
    
    const now = new Date();
    const expiresAt = new Date(counting.expiresAt);
    
    if (isAfter(now, expiresAt)) {
      return { text: 'Expirada', color: 'text-red-600 font-medium' };
    }
    
    const hoursRemaining = differenceInHours(expiresAt, now);
    const minutesRemaining = differenceInMinutes(expiresAt, now);
    
    if (hoursRemaining > 0) {
      return { 
        text: `${hoursRemaining}h restantes`, 
        color: hoursRemaining <= 2 ? 'text-orange-600' : 'text-blue-600' 
      };
    } else if (minutesRemaining > 0) {
      return { 
        text: `${minutesRemaining}min restantes`, 
        color: 'text-red-600 font-medium' 
      };
    } else {
      return { text: 'Expirada', color: 'text-red-600 font-medium' };
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = !selectedSector || product.sector_id === selectedSector;
    return matchesSearch && matchesSector;
  });

  const totalProducts = filteredProducts.length;
  const countedProducts = Object.keys(countedItems).length;
  const progress = totalProducts > 0 ? Math.round((countedProducts / totalProducts) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contagem...</p>
        </div>
      </div>
    );
  }

  if (!counting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Contagem não encontrada</h2>
          <p className="text-gray-600">A contagem solicitada não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Contagem Expirada</h2>
          <p className="text-gray-600 mb-4">O prazo para esta contagem já expirou.</p>
          
          <div className="space-y-3">
            <button
              onClick={handleReopenCounting}
              disabled={saving}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reabrindo...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reabrir Contagem
                </>
              )}
            </button>
            <p className="text-sm text-gray-500">
              Ou entre em contato com o responsável para reabrir a contagem.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (counting.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Contagem Finalizada</h2>
          <p className="text-gray-600 mb-4">Esta contagem já foi finalizada.</p>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Finalizada em: {counting.completedAt ? format(new Date(counting.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const remainingTime = getRemainingTime();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Preencher a contagem de estoque
          </h1>
          <h3 className="text-base text-gray-600 mb-1">
            Olá, <span className="font-bold">{counting.employee_name || 'Funcionário'}</span>
          </h3>
          <h3 className="text-base text-gray-600 mb-3">
            da empresa <span className="font-bold">{counting.company_name || 'Empresa'}</span>
          </h3>
          
          {remainingTime && (
            <div className={`mb-3 p-2 rounded-lg border ${
              remainingTime.color.includes('red') ? 'bg-red-50 border-red-200' :
              remainingTime.color.includes('orange') ? 'bg-orange-50 border-orange-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={`text-sm font-medium ${remainingTime.color}`}>
                  Prazo: {remainingTime.text}
                </span>
              </div>
              {counting.expiresAt && (
                <div className="text-xs text-gray-600 text-center mt-1">
                  Expira em: {format(new Date(counting.expiresAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
              )}
            </div>
          )}
          
          <h3 className="text-sm text-gray-500">
            Por favor, preencha as quantidades em estoque dos setores:{' '}
            <span className="font-bold">
              {counting.sectorIds?.join(', ') || 'N/A'}
            </span>
          </h3>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso</span>
            <span className="text-sm text-gray-500">{countedProducts}/{totalProducts} produtos</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}% concluído</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos os setores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Cards */}
      <div className="max-w-md mx-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product, index) => {
              const isCurrentProduct = index === currentProductIndex;
              const isCounted = Object.prototype.hasOwnProperty.call(countedItems, product.id);
              const conversionDisplay = formatConversionDisplay(product);
              
              return (
                <div 
                  key={product.id} 
                  className={`bg-white rounded-lg shadow-sm border p-4 ${
                    isCurrentProduct ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  } ${isCounted ? 'bg-green-50 border-green-200' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {product.code || 'S/C'}
                        </span>
                        {isCounted && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm mb-1">
                        {product.name}
                      </h4>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Unidade: <span className="font-medium">{product.unit || 'UN'}</span></p>
                        {conversionDisplay && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="font-medium text-blue-900">{conversionDisplay}</p>
                            <p className="text-blue-700 mt-1">
                              Ex: 2 {product.alternativeUnit} = {(product.conversionFactor || 1) * 2} {product.unit}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Contada
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={countedItems[product.id] || ''}
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                          id={`quantity-${product.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const input = document.getElementById(`quantity-${product.id}`) as HTMLInputElement;
                        const quantity = parseFloat(input.value) || 0;
                        handleSaveProduct(product.id, quantity);
                      }}
                      disabled={saving}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Gravar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-md mx-auto p-4 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700"
          >
            Salvar para Continuar Depois
          </button>
          
          <button
            onClick={handleFinalizeCounting}
            disabled={saving || countedProducts === 0}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Finalizar Contagem
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileCounting;