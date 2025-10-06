import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, X, Package, Tag, Filter, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, TABLES } from '../lib/supabase';
import type { Product, ProductCategory, Sector, StockMovement } from '../lib/types';

const Products: React.FC = () => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'movements'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMovementFilters, setShowMovementFilters] = useState(false);
  
  // Search states
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [categorySearchText, setCategorySearchText] = useState('');

  // Movement filters
  const [movementFilters, setMovementFilters] = useState({
    productId: '',
    movementType: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    description: '',
    categoryId: '',
    sectorId: '',
    unit: '',
    conversionFactor: 1,
    alternativeUnit: '',
    minStock: 0,
    maxStock: 0,
    currentStock: 0,
    unitCost: 0
  });

  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });

  // 🧹 COMPLETELY REMOVED: All sample data generation functions

  useEffect(() => {
    if (authState.company?.id) {
      loadData();
      if (activeTab === 'movements') {
        loadMovements();
      }
    } else {
      // 🧹 FIXED: No more sample data - just empty state
      setProducts([]);
      setCategories([]);
      setSectors([]);
      setLoading(false);
    }
  }, [authState.company, activeTab]);

  useEffect(() => {
    if (activeTab === 'movements' && authState.company?.id) {
      loadMovements();
    }
  }, [movementFilters]);

  const loadData = async () => {
    if (!authState.company?.id) {
      // 🧹 FIXED: No sample data fallback
      setProducts([]);
      setCategories([]);
      setSectors([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: productsData, error: productsError } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('company_id', authState.company.id);
      
      if (productsError) {
        console.error('Error loading products:', productsError);
        setProducts([]);
      } else {
        const mappedProducts = (productsData || []).map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description,
          categoryId: p.category_id,
          sectorId: p.sector_id,
          unit: p.unit,
          conversionFactor: p.conversion_factor || 1,
          alternativeUnit: p.alternative_unit,
          minStock: p.min_stock || 0,
          maxStock: p.max_stock || 0,
          currentStock: p.current_stock || 0,
          unitCost: p.unit_cost || 0,
          companyId: p.company_id,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
        setProducts(mappedProducts);
      }
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from(TABLES.PRODUCT_CATEGORIES)
        .select('*')
        .eq('company_id', authState.company.id);
      
      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        setCategories([]);
      } else {
        const mappedCategories = (categoriesData || []).map(c => ({
          id: c.id,
          name: c.name,
          companyId: c.company_id,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }));
        setCategories(mappedCategories);
      }
      
      const { data: sectorsData, error: sectorsError } = await supabase
        .from(TABLES.SECTORS)
        .select('*')
        .eq('company_id', authState.company.id);
      
      if (sectorsError) {
        console.error('Error loading sectors:', sectorsError);
        setSectors([]);
      } else {
        const mappedSectors = (sectorsData || []).map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          companyId: s.company_id,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
        setSectors(mappedSectors);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setProducts([]);
      setCategories([]);
      setSectors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    if (!authState.company?.id) {
      return;
    }

    try {
      let query = supabase
        .from(TABLES.STOCK_MOVEMENTS)
        .select(`
          *,
          product:${TABLES.PRODUCTS}(name, code)
        `)
        .eq('company_id', authState.company.id)
        .order('created_at', { ascending: false });

      if (movementFilters.productId) {
        query = query.eq('product_id', movementFilters.productId);
      }
      
      if (movementFilters.movementType) {
        query = query.eq('movement_type', movementFilters.movementType);
      }
      
      if (movementFilters.startDate) {
        query = query.gte('created_at', movementFilters.startDate);
      }
      
      if (movementFilters.endDate) {
        query = query.lte('created_at', movementFilters.endDate + 'T23:59:59');
      }

      const { data: movementsData, error: movementsError } = await query;

      if (movementsError) {
        setMovements([]);
        return;
      }

      const mappedMovements = (movementsData || []).map(m => ({
        id: m.id,
        productId: m.product_id,
        movementType: m.movement_type,
        quantityBefore: m.quantity_before,
        quantityAfter: m.quantity_after,
        difference: m.quantity_after - m.quantity_before,
        userId: m.user_id,
        notes: m.notes,
        referenceId: m.reference_id,
        companyId: m.company_id,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        productName: m.product?.name || 'Produto não encontrado'
      }));

      let filteredMovements = mappedMovements;
      if (movementFilters.searchTerm) {
        const searchTerm = movementFilters.searchTerm.toLowerCase();
        filteredMovements = mappedMovements.filter(m => 
          m.productName?.toLowerCase().includes(searchTerm) ||
          m.notes?.toLowerCase().includes(searchTerm)
        );
      }

      setMovements(filteredMovements);

    } catch (error) {
      setMovements([]);
    }
  };

  // Filter products using useMemo for better performance
  const filtered = useMemo(() => {
    return products.filter(p => {
      const textMatch = searchText === '' || 
        (p.name && p.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (p.code && typeof p.code === 'string' && p.code.toLowerCase().includes(searchText.toLowerCase()));
      
      const catMatch = categoryFilter === '' || p.categoryId === categoryFilter;
      const secMatch = sectorFilter === '' || p.sectorId === sectorFilter;
      
      return textMatch && catMatch && secMatch;
    });
  }, [products, searchText, categoryFilter, sectorFilter]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      return categorySearchText === '' || 
        (category.name && category.name.toLowerCase().includes(categorySearchText.toLowerCase()));
    });
  }, [categories, categorySearchText]);

  // Helper functions
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  const getSectorName = (sectorId: string) => {
    const sector = sectors.find(s => s.id === sectorId);
    return sector?.name || 'Sem setor';
  };

  const getProductCountForCategory = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const getMovementTypeBadge = (type: string) => {
    const badges = {
      'counting_approved': { label: 'Contagem Aprovada', color: 'bg-green-100 text-green-800' },
      'manual_adjustment': { label: 'Ajuste Manual', color: 'bg-blue-100 text-blue-800' },
      'entry': { label: 'Entrada', color: 'bg-yellow-100 text-yellow-800' },
      'exit': { label: 'Saída', color: 'bg-red-100 text-red-800' }
    };
    return badges[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDifference = (difference: number) => {
    if (difference > 0) {
      return <span className="text-green-600 font-medium">+{difference}</span>;
    } else if (difference < 0) {
      return <span className="text-red-600 font-medium">{difference}</span>;
    }
    return <span className="text-gray-600">0</span>;
  };

  // Form handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.name.trim()) {
      alert('Nome do produto é obrigatório.');
      return;
    }

    try {
      const safeString = (value: any) => {
        if (value === null || value === undefined) return '';
        return String(value);
      };

      const newProduct: Product = {
        id: editingProduct?.id || `product-${Date.now()}`,
        name: safeString(productForm.name).trim(),
        code: safeString(productForm.code).trim() || null,
        description: safeString(productForm.description).trim() || null,
        categoryId: productForm.categoryId || null,
        sectorId: productForm.sectorId || null,
        unit: safeString(productForm.unit).trim() || null,
        conversionFactor: Number(productForm.conversionFactor) || 1,
        alternativeUnit: safeString(productForm.alternativeUnit).trim() || null,
        minStock: Number(productForm.minStock) || 0,
        maxStock: Number(productForm.maxStock) || 0,
        currentStock: Number(productForm.currentStock) || 0,
        unitCost: Number(productForm.unitCost) || 0,
        companyId: authState.company?.id || 'sample-company',
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (authState.company?.id && authState.user?.id) {
        const productData = {
          name: newProduct.name,
          code: newProduct.code,
          description: newProduct.description,
          category_id: newProduct.categoryId,
          sector_id: newProduct.sectorId,
          unit: newProduct.unit,
          conversion_factor: newProduct.conversionFactor,
          alternative_unit: newProduct.alternativeUnit,
          min_stock: newProduct.minStock,
          max_stock: newProduct.maxStock,
          current_stock: newProduct.currentStock,
          unit_cost: newProduct.unitCost,
          company_id: authState.company.id,
          updated_at: new Date().toISOString()
        };

        if (editingProduct) {
          const { data, error } = await supabase
            .from(TABLES.PRODUCTS)
            .update(productData)
            .eq('id', editingProduct.id)
            .eq('company_id', authState.company.id)
            .select()
            .single();
          
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from(TABLES.PRODUCTS)
            .insert(productData)
            .select()
            .single();
          
          if (error) throw error;
          newProduct.id = data.id;
        }
      }

      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? newProduct : p));
        alert('Produto atualizado com sucesso!');
      } else {
        setProducts(prev => [...prev, newProduct]);
        alert('Produto criado com sucesso!');
      }

      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto.');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('Nome da categoria é obrigatório.');
      return;
    }

    try {
      const newCategory: ProductCategory = {
        id: editingCategory?.id || `category-${Date.now()}`,
        name: categoryForm.name.trim(),
        companyId: authState.company?.id || 'sample-company',
        createdAt: editingCategory?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (authState.company?.id && authState.user?.id) {
        const categoryData = {
          name: newCategory.name,
          company_id: authState.company.id
        };

        if (editingCategory) {
          const { error } = await supabase
            .from(TABLES.PRODUCT_CATEGORIES)
            .update(categoryData)
            .eq('id', editingCategory.id);
          
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from(TABLES.PRODUCT_CATEGORIES)
            .insert(categoryData)
            .select()
            .single();
          
          if (error) throw error;
          newCategory.id = data.id;
        }
      }

      if (editingCategory) {
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? newCategory : c));
        alert('Categoria atualizada com sucesso!');
      } else {
        setCategories(prev => [...prev, newCategory]);
        alert('Categoria criada com sucesso!');
      }

      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    } catch (error) {
      alert('Erro ao salvar categoria. Tente novamente.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      if (authState.company?.id) {
        const { error } = await supabase
          .from(TABLES.PRODUCTS)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Produto excluído com sucesso!');
    } catch (error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Produto excluído localmente (erro na sincronização com servidor).');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      if (authState.company?.id) {
        const { error } = await supabase
          .from(TABLES.PRODUCT_CATEGORIES)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setCategories(prev => prev.filter(c => c.id !== id));
      alert('Categoria excluída com sucesso!');
    } catch (error) {
      setCategories(prev => prev.filter(c => c.id !== id));
      alert('Categoria excluída localmente (erro na sincronização com servidor).');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      code: product.code || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      sectorId: product.sectorId || '',
      unit: product.unit || '',
      conversionFactor: product.conversionFactor || 1,
      alternativeUnit: product.alternativeUnit || '',
      minStock: product.minStock || 0,
      maxStock: product.maxStock || 0,
      currentStock: product.currentStock || 0,
      unitCost: product.unitCost || 0
    });
    setShowProductForm(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name || '' });
    setShowCategoryForm(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '', code: '', description: '', categoryId: '', sectorId: '',
      unit: '', conversionFactor: 1, alternativeUnit: '', minStock: 0,
      maxStock: 0, currentStock: 0, unitCost: 0
    });
  };

  const clearMovementFilters = () => {
    setMovementFilters({
      productId: '', movementType: '', startDate: '', endDate: '', searchTerm: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando produtos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
        <div className="text-sm text-gray-600">
          {products.length} produtos encontrados
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Produtos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            Categorias ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Movimentações ({movements.length})
          </button>
        </nav>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciar Produtos</h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                resetProductForm();
                setShowProductForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
            </div>

            {/* Search Input - Combined */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou código do produto..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Categoria
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Setor
                  </label>
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os setores</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filtered.length} de {products.length} produtos
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Setor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length > 0 ? (
                    filtered.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-gray-500">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCategoryName(product.categoryId || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getSectorName(product.sectorId || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.unit || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.conversionFactor && product.conversionFactor > 1 && product.alternativeUnit 
                            ? `1 ${product.alternativeUnit} = ${product.conversionFactor} ${product.unit}`
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.currentStock <= product.minStock 
                              ? 'bg-red-100 text-red-800' 
                              : product.currentStock >= product.maxStock 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.currentStock || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar produto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-500 mb-2">
                          {products.length === 0 ? 'Nenhum produto encontrado' : 'Nenhum produto corresponde aos filtros aplicados'}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          {products.length === 0 
                            ? 'Comece adicionando seu primeiro produto ao sistema.'
                            : 'Tente ajustar os filtros ou limpar a busca.'
                          }
                        </p>
                        {products.length === 0 && (
                          <button
                            onClick={() => {
                              setEditingProduct(null);
                              resetProductForm();
                              setShowProductForm(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar Primeiro Produto
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciar Categorias</h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '' });
                setShowCategoryForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Categoria
            </button>
          </div>

          {/* Search for Categories */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={categorySearchText}
                onChange={(e) => setCategorySearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filteredCategories.length} de {categories.length} categorias
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produtos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getProductCountForCategory(category.id)} produtos
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        {categories.length === 0 ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria corresponde à busca'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Histórico de Movimentações</h2>
          </div>

          {/* Movement Filters */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </h3>
              <button
                onClick={() => setShowMovementFilters(!showMovementFilters)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showMovementFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
            </div>

            {/* Basic Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por produto ou observações..."
                  value={movementFilters.searchTerm}
                  onChange={(e) => setMovementFilters({ ...movementFilters, searchTerm: e.target.value })}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Advanced Filters */}
            {showMovementFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto
                  </label>
                  <select
                    value={movementFilters.productId}
                    onChange={(e) => setMovementFilters({ ...movementFilters, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os produtos</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Movimentação
                  </label>
                  <select
                    value={movementFilters.movementType}
                    onChange={(e) => setMovementFilters({ ...movementFilters, movementType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="counting_approved">Contagem Aprovada</option>
                    <option value="manual_adjustment">Ajuste Manual</option>
                    <option value="entry">Entrada</option>
                    <option value="exit">Saída</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={movementFilters.startDate}
                    onChange={(e) => setMovementFilters({ ...movementFilters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={movementFilters.endDate}
                    onChange={(e) => setMovementFilters({ ...movementFilters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {movements.length} movimentações
              </div>
              <button
                onClick={clearMovementFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd Anterior
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diferença
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.length > 0 ? (
                    movements.map((movement) => {
                      const badge = getMovementTypeBadge(movement.movementType);
                      return (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(movement.createdAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {movement.productName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.quantityBefore}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.quantityAfter}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatDifference(movement.difference)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {movement.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        <div className="py-8">
                          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-500 mb-2">Nenhuma movimentação encontrada</p>
                          <p className="text-sm text-gray-400 mb-4">
                            As movimentações aparecerão aqui quando produtos forem criados, editados ou contagens aprovadas.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Parafuso Phillips 6x40mm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Produto
                  </label>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: PAR-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição detalhada do produto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Setor
                  </label>
                  <select
                    value={productForm.sectorId}
                    onChange={(e) => setProductForm({ ...productForm, sectorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um setor</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: UN, KG, L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fator de Conversão
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.conversionFactor}
                    onChange={(e) => setProductForm({ ...productForm, conversionFactor: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade Alternativa
                  </label>
                  <input
                    type="text"
                    value={productForm.alternativeUnit}
                    onChange={(e) => setProductForm({ ...productForm, alternativeUnit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: CX, PCT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Máximo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.maxStock}
                    onChange={(e) => setProductForm({ ...productForm, maxStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custo Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.unitCost}
                    onChange={(e) => setProductForm({ ...productForm, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Ferramentas, Parafusos, Eletrônicos"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;