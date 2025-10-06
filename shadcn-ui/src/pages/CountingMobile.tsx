import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Save, 
  Clock, 
  CheckCircle,
  Calculator,
  Package,
  Users,
  Building2,
  Calendar,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  sector: string;
  company_id: string;
}

interface CountingItem {
  id: string;
  product_id: string;
  quantity: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  product: Product;
  user_name?: string;
}

interface Counting {
  id: string;
  name: string;
  status: 'active' | 'completed';
  created_at: string;
  company_id: string;
  sector_filter?: string;
}

// Helper function to handle numeric input
const handleNumericInput = (value: string, unit?: string): string => {
  // Check if unit allows fractional values (weight units)
  const allowsFractional = unit && ['KILO', 'KG', 'GRAMA', 'GR'].includes(unit.toUpperCase());
  
  if (allowsFractional) {
    // For weight units, allow numbers and comma
    const cleanValue = value.replace(/[^0-9,]/g, '');
    // Ensure only one comma
    const parts = cleanValue.split(',');
    if (parts.length > 2) {
      return parts[0] + ',' + parts.slice(1).join('');
    }
    return cleanValue;
  } else {
    // For other units, remove any non-numeric characters (current behavior)
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue;
  }
};

export default function CountingMobile() {
  const { countingId } = useParams<{ countingId: string }>();
  const navigate = useNavigate();
  
  const [counting, setCounting] = useState<Counting | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [countingItems, setCountingItems] = useState<CountingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCalculator, setShowCalculator] = useState<string | null>(null);
  const [calculatorValue, setCalculatorValue] = useState('');
  const [conversionFactor, setConversionFactor] = useState(1);
  const [showZeroQuantities, setShowZeroQuantities] = useState(false);
  
  // Calculator state
  const [calculatorBoxes, setCalculatorBoxes] = useState('');
  const [calculatorResult, setCalculatorResult] = useState(0);

  useEffect(() => {
    if (countingId) {
      fetchCountingData();
    }
  }, [countingId]);

  const fetchCountingData = async () => {
    try {
      setLoading(true);
      
      // Fetch counting details
      const { data: countingData, error: countingError } = await supabase
        .from('countings')
        .select('*')
        .eq('id', countingId)
        .single();

      if (countingError) throw countingError;
      setCounting(countingData);

      // Fetch products for the same company, filtered by sector if specified
      let productsQuery = supabase
        .from('products')
        .select('*')
        .eq('company_id', countingData.company_id)
        .order('name');

      if (countingData.sector_filter) {
        productsQuery = productsQuery.eq('sector', countingData.sector_filter);
      }

      const { data: productsData, error: productsError } = await productsQuery;
      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch existing counting items with user names
      const { data: itemsData, error: itemsError } = await supabase
        .from('counting_items')
        .select(`
          *,
          product:products(*),
          user:users(name)
        `)
        .eq('counting_id', countingId);

      if (itemsError) throw itemsError;
      
      // Transform the data to include user names
      const itemsWithUserNames = (itemsData || []).map(item => ({
        ...item,
        user_name: item.user?.name || 'Unknown User'
      }));
      
      setCountingItems(itemsWithUserNames);
    } catch (error) {
      console.error('Error fetching counting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      setSaving(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingItem = countingItems.find(item => item.product_id === productId);

      if (existingItem) {
        // Update existing item
        const { error } = await supabase
          .from('counting_items')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;

        setCountingItems(prev => prev.map(item => 
          item.id === existingItem.id 
            ? { ...item, quantity: newQuantity, updated_at: new Date().toISOString() }
            : item
        ));
      } else if (newQuantity > 0) {
        // Create new item
        const { data, error } = await supabase
          .from('counting_items')
          .insert({
            counting_id: countingId,
            product_id: productId,
            quantity: newQuantity,
            user_id: user.id
          })
          .select(`
            *,
            product:products(*),
            user:users(name)
          `)
          .single();

        if (error) throw error;

        const newItem = {
          ...data,
          user_name: data.user?.name || 'Unknown User'
        };

        setCountingItems(prev => [...prev, newItem]);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setSaving(false);
    }
  };

  const getProductQuantity = (productId: string): number => {
    const item = countingItems.find(item => item.product_id === productId);
    return item?.quantity || 0;
  };

  const getProductUnit = (product: Product): string => {
    return product.unit || 'UN';
  };

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
  const sectors = [...new Set(products.map(p => p.sector))].filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSector = !selectedSector || product.sector === selectedSector;
    const hasQuantity = showZeroQuantities || getProductQuantity(product.id) > 0;
    
    return matchesSearch && matchesCategory && matchesSector && (showZeroQuantities || !hasQuantity || getProductQuantity(product.id) > 0);
  });

  const handleCalculatorSubmit = (productId: string) => {
    const boxes = parseInt(calculatorBoxes) || 0;
    const totalQuantity = boxes * conversionFactor;
    updateQuantity(productId, totalQuantity);
    setShowCalculator(null);
    setCalculatorBoxes('');
    setCalculatorResult(0);
    setConversionFactor(1);
  };

  const saveForLater = async () => {
    // Data is already saved in real-time, just show confirmation
    alert('Dados salvos com sucesso!');
  };

  const finalizeCounting = async () => {
    try {
      const { error } = await supabase
        .from('countings')
        .update({ status: 'completed' })
        .eq('id', countingId);

      if (error) throw error;
      
      alert('Contagem finalizada com sucesso!');
      navigate('/countings');
    } catch (error) {
      console.error('Error finalizing counting:', error);
      alert('Erro ao finalizar contagem');
    }
  };

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

  if (!counting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Contagem não encontrada</p>
          <button 
            onClick={() => navigate('/countings')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/countings')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowZeroQuantities(!showZeroQuantities)}
                className={`p-2 rounded-lg ${showZeroQuantities ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                title={showZeroQuantities ? 'Ocultar quantidades zero' : 'Mostrar quantidades zero'}
              >
                {showZeroQuantities ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{counting.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(counting.created_at).toLocaleDateString('pt-BR')}
                </span>
                <Badge variant={counting.status === 'active' ? 'default' : 'secondary'}>
                  {counting.status === 'active' ? 'Ativa' : 'Finalizada'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white border-b">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <select
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white min-w-0 flex-shrink-0"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white min-w-0 flex-shrink-0"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="">Todos Setores</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="p-4 space-y-3">
        {filteredProducts.map(product => {
          const quantity = getProductQuantity(product.id);
          const unit = getProductUnit(product);
          
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-gray-500">{product.category}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{product.sector}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm font-medium text-blue-600">{unit}</span>
                  </div>
                </div>
              </div>

              {/* Calculator Modal */}
              {showCalculator === product.id && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-3">
                    <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-blue-900">CALCULADORA DE CONVERSÃO</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Digite quantas caixas/embalagens:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={calculatorBoxes}
                          onChange={(e) => {
                            setCalculatorBoxes(e.target.value);
                            const boxes = parseInt(e.target.value) || 0;
                            setCalculatorResult(boxes * conversionFactor);
                          }}
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">×</span>
                        <input
                          type="number"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={conversionFactor}
                          onChange={(e) => {
                            setConversionFactor(parseInt(e.target.value) || 1);
                            const boxes = parseInt(calculatorBoxes) || 0;
                            setCalculatorResult(boxes * (parseInt(e.target.value) || 1));
                          }}
                          placeholder="1"
                        />
                        <span className="text-sm text-gray-500">=</span>
                        <span className="font-bold text-lg text-blue-600 min-w-0">
                          {calculatorResult} {unit}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Gramatura:</span>
                        <div className="font-medium">{unit}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Fator conversão:</span>
                        <div className="font-medium">{conversionFactor}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleCalculatorSubmit(product.id)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      CALCULAR E USAR
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade:
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(product.id, Math.max(0, quantity - 1))}
                      className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center"
                      disabled={saving}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <input
                      type="text"
                      className="flex-1 text-center py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-lg"
                      value={quantity}
                      onChange={(e) => {
                        const productUnit = getProductUnit(product);
                        const processedValue = handleNumericInput(e.target.value, productUnit);
                        
                        if (productUnit && ['KILO', 'KG', 'GRAMA', 'GR'].includes(productUnit.toUpperCase())) {
                          // For weight units, handle fractional values
                          const numericValue = processedValue === '' ? 0 : parseFloat(processedValue.replace(',', '.'));
                          updateQuantity(product.id, isNaN(numericValue) ? 0 : numericValue);
                        } else {
                          // For other units, use integer values (current behavior)
                          const numericValue = processedValue === '' ? 0 : parseInt(processedValue);
                          updateQuantity(product.id, numericValue);
                        }
                      }}
                      disabled={saving}
                    />
                    
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center"
                      disabled={saving}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCalculator(showCalculator === product.id ? null : product.id)}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculadora
                  </button>
                </div>
              </div>

              {/* Show who counted and when */}
              {quantity > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {(() => {
                    const item = countingItems.find(item => item.product_id === product.id);
                    return item ? (
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{item.user_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{new Date(item.updated_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 space-y-3">
        <button
          onClick={saveForLater}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          disabled={saving}
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        
        <button
          onClick={saveForLater}
          className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
        >
          <Clock className="h-5 w-5 mr-2" />
          Salvar para continuar mais tarde
        </button>
        
        <button
          onClick={finalizeCounting}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Finalizar Contagem
        </button>
      </div>

      {/* Bottom padding to prevent content from being hidden behind fixed buttons */}
      <div className="h-48"></div>
    </div>
  );
}