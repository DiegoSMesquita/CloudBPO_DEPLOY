import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Square, 
  Clock, 
  MessageCircle, 
  CheckCircle, 
  X, 
  Copy, 
  Send, 
  Search,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, TABLES } from '../lib/supabase';
import { format, parseISO, isAfter, differenceInHours, differenceInMinutes, differenceInDays, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
// Import CloudBPO logo
import logoAzul from '@/assets/images/logo-azul.png';

// Types for counting system
interface Sector {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  code?: string;
  unit?: string;
  currentBalance: number;
  companyId: string;
  sectorId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CountedItem {
  id: string;
  productId: string;
  countingId: string;
  countedQuantity: number;
  notes?: string;
  countedAt: string;
  countedBy?: string;
}

interface Counting {
  id: string;
  internalId?: string;
  name: string;
  title?: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'expired';
  companyId: string;
  createdBy?: string;
  employee_name?: string | null;
  whatsappNumber?: string | null;
  sectors?: Sector[];
  sectorIds?: string[];
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  approvedAt?: string | null;
  expiresAt?: string | null;
  mobileLink?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface CountingWithDetails extends Counting {
  products?: Product[];
  countedItems?: CountedItem[];
}

// Excel Export Configuration Modal
interface ExcelExportModalProps {
  counting: CountingWithDetails;
  onClose: () => void;
  onExport: (config: ExcelExportConfig) => void;
}

interface ExcelExportConfig {
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  encoding: 'UTF-8' | 'ISO-8859-1';
  includeColumns: {
    product: boolean;
    code: boolean;
    currentBalance: boolean;
    countedBalance: boolean;
    difference: boolean;
    unit: boolean;
    notes: boolean;
  };
}

const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ counting, onClose, onExport }) => {
  const [config, setConfig] = useState<ExcelExportConfig>({
    decimalSeparator: ',',
    thousandsSeparator: '.',
    dateFormat: 'dd/MM/yyyy',
    encoding: 'UTF-8',
    includeColumns: {
      product: true,
      code: true,
      currentBalance: true,
      countedBalance: true,
      difference: true,
      unit: true,
      notes: true,
    }
  });

  const handleExport = () => {
    onExport(config);
    onClose();
  };

  const formatNumber = (num: number) => {
    const formatted = num.toFixed(2);
    if (config.decimalSeparator === ',') {
      return formatted.replace('.', ',');
    }
    return formatted;
  };

  const formatDatePreview = () => {
    try {
      const now = new Date();
      switch (config.dateFormat) {
        case 'dd/MM/yyyy':
          return format(now, 'dd/MM/yyyy', { locale: ptBR });
        case 'MM/dd/yyyy':
          return format(now, 'MM/dd/yyyy', { locale: ptBR });
        case 'yyyy-MM-dd':
          return format(now, 'yyyy-MM-dd', { locale: ptBR });
        default:
          return format(now, 'dd/MM/yyyy', { locale: ptBR });
      }
    } catch (error) {
      console.error('Error formatting date preview:', error);
      return '23/09/2025';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold">Exportar para Excel</h2>
              <p className="text-sm text-gray-600">Configure as opções de exportação</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Contagem a Exportar</h3>
            <div className="text-sm text-gray-600">
              <div><strong>Nome:</strong> {counting.name}</div>
              <div><strong>ID:</strong> {counting.internalId}</div>
              <div><strong>Status:</strong> {counting.status}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Configurações de Formato</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Separador Decimal
                </label>
                <select
                  value={config.decimalSeparator}
                  onChange={(e) => setConfig({ ...config, decimalSeparator: e.target.value as '.' | ',' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value=",">Vírgula (,)</option>
                  <option value=".">Ponto (.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Separador de Milhares
                </label>
                <select
                  value={config.thousandsSeparator}
                  onChange={(e) => setConfig({ ...config, thousandsSeparator: e.target.value as ',' | '.' | ' ' | '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value=".">Ponto (.)</option>
                  <option value=",">Vírgula (,)</option>
                  <option value=" ">Espaço ( )</option>
                  <option value="">Nenhum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de Data
                </label>
                <select
                  value={config.dateFormat}
                  onChange={(e) => setConfig({ ...config, dateFormat: e.target.value as ExcelExportConfig['dateFormat'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                  <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                  <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codificação
                </label>
                <select
                  value={config.encoding}
                  onChange={(e) => setConfig({ ...config, encoding: e.target.value as 'UTF-8' | 'ISO-8859-1' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="UTF-8">UTF-8</option>
                  <option value="ISO-8859-1">ISO-8859-1</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Colunas a Incluir</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                product: 'Produto',
                code: 'Código',
                currentBalance: 'Saldo Atual',
                countedBalance: 'Saldo Contado',
                difference: 'Diferença',
                unit: 'Unidade',
                notes: 'Observações'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeColumns[key as keyof typeof config.includeColumns]}
                    onChange={(e) => setConfig({
                      ...config,
                      includeColumns: {
                        ...config.includeColumns,
                        [key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Prévia da Formatação</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div><strong>Número:</strong> {formatNumber(1234.56)}</div>
              <div><strong>Data:</strong> {formatDatePreview()}</div>
              <div><strong>Codificação:</strong> {config.encoding}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CountingDetailModalProps {
  counting: CountingWithDetails;
  onClose: () => void;
  onApprove: (countingId: string) => void;
  onExtendTime: (counting: Counting) => void;
}

const CountingDetailModal: React.FC<CountingDetailModalProps> = ({
  counting,
  onClose,
  onApprove,
  onExtendTime
}) => {
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [countedItems, setCountedItems] = useState<CountedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealData();
  }, [counting.id]);

  const loadRealData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados reais da contagem:', counting.id);

      const { data: productsData, error: productsError } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('company_id', counting.companyId);

      if (productsError) {
        console.error('❌ Erro ao carregar produtos:', productsError);
        throw productsError;
      }

      const mappedProducts: Product[] = (productsData || []).map(product => ({
        id: product.id,
        name: product.name || 'Produto sem nome',
        description: product.description,
        code: product.code,
        unit: product.unit || 'un',
        currentBalance: product.current_stock || product.quantity || 0,
        companyId: product.company_id,
        sectorId: product.sector_id,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }));

      console.log('✅ Produtos carregados:', mappedProducts.length);

      let filteredProducts = mappedProducts;
      
      const countingSectors = await getCountingSectors(counting);
      if (countingSectors.length > 0) {
        const sectorIds = countingSectors.map(s => s.id);
        filteredProducts = mappedProducts.filter(p => 
          p.sectorId && sectorIds.includes(p.sectorId)
        );
        console.log(`🎯 Produtos filtrados por setores (${sectorIds.length}):`, filteredProducts.length);
      }

      setProducts(filteredProducts);

      try {
        console.log('🔍 Tentando carregar itens contados...');
        
        const possibleTables = [
          'app_0bcfd220f3_counting_items',
          'counting_items',
          'app_0bcfd220f3_counted_items',
          'counted_items'
        ];

        let countedData = null;
        let usedTable = '';

        for (const tableName of possibleTables) {
          try {
            console.log(`🔍 Testando tabela: ${tableName}`);
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq('counting_id', counting.id)
              .limit(1);

            if (!error) {
              console.log(`✅ Tabela encontrada: ${tableName}`);
              const { data: allData, error: allError } = await supabase
                .from(tableName)
                .select('*')
                .eq('counting_id', counting.id);

              if (!allError) {
                countedData = allData;
                usedTable = tableName;
                break;
              }
            }
          } catch (tableError) {
            console.log(`⚠️ Tabela ${tableName} não existe ou erro:`, tableError);
          }
        }

        if (countedData && usedTable) {
          console.log(`✅ Dados encontrados na tabela: ${usedTable}`, countedData.length);
          console.log('🔍 Estrutura do primeiro item:', countedData[0]);

          const mappedCountedItems: CountedItem[] = countedData.map(item => ({
            id: item.id,
            productId: item.product_id,
            countingId: item.counting_id,
            countedQuantity: item.counted_quantity || item.quantity || 0,
            notes: item.notes,
            countedAt: item.counted_at || item.created_at,
            countedBy: item.counted_by
          }));

          setCountedItems(mappedCountedItems);
          console.log('✅ Itens contados mapeados:', mappedCountedItems.length);
        } else {
          console.log('⚠️ Nenhuma tabela de itens contados encontrada');
          setCountedItems([]);
        }
      } catch (countedError) {
        console.log('⚠️ Erro ao carregar itens contados:', countedError);
        setCountedItems([]);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados reais:', error);
      setProducts([]);
      setCountedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getCountingSectors = async (counting: Counting): Promise<Sector[]> => {
    try {
      if (counting.sectors && counting.sectors.length > 0) {
        return counting.sectors;
      }

      const { data: countingData } = await supabase
        .from(TABLES.COUNTINGS)
        .select('sector_id, description')
        .eq('id', counting.id)
        .single();

      const sectorIds: string[] = [];

      if (countingData?.sector_id) {
        sectorIds.push(countingData.sector_id);
      }

      if (countingData?.description) {
        try {
          const parsed = JSON.parse(countingData.description);
          if (parsed.sector_ids && Array.isArray(parsed.sector_ids)) {
            sectorIds.push(...parsed.sector_ids);
          } else if (parsed.selected_sectors && Array.isArray(parsed.selected_sectors)) {
            sectorIds.push(...parsed.selected_sectors);
          }
        } catch (e) {
          console.log('Description não é JSON válido');
        }
      }

      if (sectorIds.length > 0) {
        const { data: sectorsData } = await supabase
          .from(TABLES.SECTORS)
          .select('*')
          .in('id', [...new Set(sectorIds)]);

        return (sectorsData || []).map(sector => ({
          id: sector.id,
          name: sector.name,
          description: sector.description,
          companyId: sector.company_id,
          createdAt: sector.created_at,
          updatedAt: sector.updated_at
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao carregar setores da contagem:', error);
      return [];
    }
  };

  const handleAdjustmentChange = (productId: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const getStatusBadge = (counting: Counting) => {
    switch (counting.status) {
      case 'completed':
        return { label: 'Concluída', color: 'bg-green-100 text-green-800' };
      case 'in_progress':
        return { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { label: 'Aprovada', color: 'bg-green-100 text-green-800' };
      case 'expired':
        return { label: 'Expirada', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Pendente', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getRemainingTime = (counting: Counting) => {
    if (counting.status === 'approved') {
      return { text: '-', color: 'text-gray-500' };
    }

    if (counting.status === 'completed') {
      return { text: 'Concluída', color: 'text-green-600' };
    }

    if (counting.status === 'expired') {
      return { text: 'Expirada', color: 'text-red-600 font-medium' };
    }

    if (!counting.scheduledDate || !counting.scheduledTime) {
      return { text: 'Sem prazo', color: 'text-gray-500' };
    }

    const now = new Date();
    const scheduledDateTime = new Date(`${counting.scheduledDate}T${counting.scheduledTime}`);

    if (isAfter(now, scheduledDateTime)) {
      const hoursOverdue = differenceInHours(now, scheduledDateTime);
      const daysOverdue = differenceInDays(now, scheduledDateTime);
      
      if (daysOverdue > 0) {
        return { 
          text: `${daysOverdue}d atrasada`, 
          color: 'text-red-600 font-medium' 
        };
      } else {
        return { 
          text: `${hoursOverdue}h atrasada`, 
          color: 'text-red-600 font-medium' 
        };
      }
    } else {
      const hoursRemaining = differenceInHours(scheduledDateTime, now);
      const minutesRemaining = differenceInMinutes(scheduledDateTime, now);
      const daysRemaining = differenceInDays(scheduledDateTime, now);
      
      if (daysRemaining > 0) {
        return { 
          text: `${daysRemaining}d restantes`, 
          color: daysRemaining <= 1 ? 'text-orange-600' : 'text-blue-600' 
        };
      } else if (hoursRemaining > 0) {
        return { 
          text: `${hoursRemaining}h restantes`, 
          color: hoursRemaining <= 2 ? 'text-orange-600' : 'text-blue-600' 
        };
      } else {
        return { 
          text: `${minutesRemaining}min restantes`, 
          color: 'text-red-600 font-medium' 
        };
      }
    }
  };

  const combinedProducts = products.map(product => {
    const countedItem = countedItems.find(item => item.productId === product.id);
    const countedBalance = countedItem ? countedItem.countedQuantity : 0;
    const difference = countedItem ? (countedBalance - product.currentBalance) : 0;
    const adjustment = Object.prototype.hasOwnProperty.call(adjustments, product.id) ? adjustments[product.id] : countedBalance;

    return {
      ...product,
      countedItem,
      currentBalance: product.currentBalance,
      countedBalance,
      difference,
      adjustment,
      isCounted: !!countedItem
    };
  });

  const isAdjustmentEditable = counting.status === 'completed';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Carregando dados da contagem...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalhes da Contagem</h2>
            <p className="text-sm text-gray-600">ID: {counting.internalId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Nome</h3>
                <p className="text-gray-900 font-medium">{counting.name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Status</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(counting).color}`}>
                  {getStatusBadge(counting).label}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Tempo Restante</h3>
                <p className={getRemainingTime(counting).color}>
                  {getRemainingTime(counting).text}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Funcionário</h3>
                <p className="text-gray-900">{counting.employee_name || 'Não atribuído'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Data Agendada</h3>
                <p className="text-gray-900">
                  {counting.scheduledDate 
                    ? format(new Date(counting.scheduledDate), 'dd/MM/yyyy', { locale: ptBR })
                    : 'Não agendada'
                  }
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Horário</h3>
                <p className="text-gray-900">{counting.scheduledTime || 'Flexível'}</p>
              </div>
            </div>
            
            {counting.description && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 text-sm">Descrição</h3>
                <p className="text-gray-900">{counting.description}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Produtos da Contagem ({combinedProducts.length} produtos)
              </h3>
              {isAdjustmentEditable && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  Ajustes editáveis (contagem concluída)
                </div>
              )}
              {!isAdjustmentEditable && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-4 h-4" />
                  Ajustes bloqueados (conclua a contagem primeiro)
                </div>
              )}
            </div>
            
            {combinedProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Produto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Código
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Saldo Atual
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Saldo Contado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Diferença
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Ajuste
                        {isAdjustmentEditable && (
                          <span className="ml-1 text-green-600">✏️</span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {combinedProducts.map((item) => {
                      return (
                        <tr key={item.id} className={`hover:bg-gray-50 ${!item.isCounted ? 'bg-yellow-50' : ''}`}>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              {!item.isCounted && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                                  Não contado
                                </span>
                              )}
                              {item.isCounted && (
                                <span className="ml-2 px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">
                                  ✓ Contado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.code || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.currentBalance.toFixed(2)} {item.unit || ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.isCounted ? `${item.countedBalance.toFixed(2)} ${item.unit || ''}` : '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${
                            item.difference > 0 ? 'text-green-600' : 
                            item.difference < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.isCounted ? (
                              <>
                                {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)} {item.unit || ''}
                              </>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.adjustment}
                              onChange={(e) => handleAdjustmentChange(item.id, Number(e.target.value))}
                              className={`w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:border-transparent ${
                                isAdjustmentEditable 
                                  ? 'border-gray-300 focus:ring-blue-500 bg-white' 
                                  : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                              }`}
                              disabled={!isAdjustmentEditable}
                              title={isAdjustmentEditable ? 'Editar ajuste final' : 'Conclua a contagem para editar ajustes'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
                <p className="text-gray-400 text-sm mt-2">
                  Verifique se os setores foram selecionados corretamente na criação da contagem
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-3">
              {(counting.status === 'in_progress' || counting.status === 'expired') && (
                <button
                  onClick={() => onExtendTime(counting)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  {counting.status === 'expired' ? 'Reativar Contagem' : 'Adicionar Tempo'}
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              
              {counting.status === 'completed' && (
                <button
                  onClick={() => onApprove(counting.id)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar Contagem
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Countings: React.FC = () => {
  const { authState } = useAuth();
  const [countings, setCountings] = useState<CountingWithDetails[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showExtendTimeDialog, setShowExtendTimeDialog] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showExcelExportModal, setShowExcelExportModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCounting, setSelectedCounting] = useState<CountingWithDetails | null>(null);
  const [editingCounting, setEditingCounting] = useState<Counting | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [createdCounting, setCreatedCounting] = useState<Counting | null>(null);
  const [extendHours, setExtendHours] = useState(2);
  const ITEMS_PER_PAGE = 20;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sectorIds: [] as string[],
    scheduledDate: '',
    scheduledTime: '',
    employeeName: '',
    whatsappNumber: ''
  });

  useEffect(() => {
    if (authState.company?.id) {
      loadCountings();
      loadSectors();
      
      const interval = setInterval(() => {
        checkAndUpdateExpiredCountings();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [authState.company]);

  const generatePDF = async (counting: CountingWithDetails) => {
    try {
      console.log('🔄 Starting PDF generation for counting:', counting.id);
      
      if (!counting || !counting.id) {
        throw new Error('Dados da contagem inválidos');
      }

      const countingWithData = await loadCountingDataForExport(counting);
      
      if (!countingWithData) {
        throw new Error('Falha ao carregar dados da contagem');
      }

      console.log('✅ Data loaded successfully, creating PDF...');

      let pdf;
      try {
        pdf = new jsPDF('landscape', 'mm', 'a4');
      } catch (pdfError) {
        console.error('❌ Error creating PDF instance:', pdfError);
        throw new Error('Falha ao inicializar gerador de PDF');
      }

      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let currentY = 20;

      try {
        // Add CloudBPO logo at the top
        try {
          const logoImg = new Image();
          logoImg.src = logoAzul;
          
          // Wait for image to load
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
          });
          
          // Add logo to PDF (centered at top)
          const logoWidth = 40;
          const logoHeight = 12;
          const logoX = (pageWidth - logoWidth) / 2;
          
          pdf.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
          currentY += logoHeight + 10;
        } catch (logoError) {
          console.warn('⚠️ Could not add logo to PDF:', logoError);
          // Continue without logo if it fails
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Relatório de Contagem de Estoque', pageWidth / 2, currentY, { align: 'center' });
        currentY += 20;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Informações da Contagem:', 20, currentY);
        currentY += 10;
      } catch (headerError) {
        console.error('❌ Error adding PDF header:', headerError);
        throw new Error('Falha ao adicionar cabeçalho do PDF');
      }

      try {
        pdf.setFont('helvetica', 'normal');
        const countingInfo = [
          `ID: ${counting.internalId || 'N/A'}`,
          `Nome: ${counting.name || 'Sem nome'}`,
          `Status: ${getStatusBadge(counting).label}`,
          `Funcionário: ${counting.employee_name || 'Não atribuído'}`,
          `Data Agendada: ${counting.scheduledDate ? format(new Date(counting.scheduledDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}`,
          `Horário: ${counting.scheduledTime || 'Flexível'}`,
          `Criado em: ${format(new Date(counting.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
        ];

        countingInfo.forEach(info => {
          pdf.text(info, 25, currentY);
          currentY += 7;
        });

        currentY += 10;
      } catch (infoError) {
        console.error('❌ Error adding counting info:', infoError);
        throw new Error('Falha ao adicionar informações da contagem');
      }

      try {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Produtos da Contagem:', 20, currentY);
        currentY += 10;

        const headers = ['Produto', 'Código', 'Saldo Atual', 'Saldo Contado', 'Diferença', 'Unidade'];
        const colWidths = [80, 40, 35, 35, 35, 25];
        let startX = 20;

        pdf.setFontSize(10);
        headers.forEach((header, index) => {
          pdf.rect(startX, currentY - 5, colWidths[index], 10);
          pdf.text(header, startX + 2, currentY);
          startX += colWidths[index];
        });
        currentY += 10;

        pdf.setFont('helvetica', 'normal');
        const products = countingWithData.products || [];
        
        console.log(`📄 Adding ${products.length} products to PDF`);

        products.forEach((product, index) => {
          if (currentY > pageHeight - 30) {
            pdf.addPage('landscape');
            currentY = 20;
            
            startX = 20;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            headers.forEach((header, index) => {
              pdf.rect(startX, currentY - 5, colWidths[index], 10);
              pdf.text(header, startX + 2, currentY);
              startX += colWidths[index];
            });
            currentY += 10;
            pdf.setFont('helvetica', 'normal');
          }

          startX = 20;
          const rowData = [
            (product.name || 'Produto sem nome').length > 35 ? 
              (product.name || 'Produto sem nome').substring(0, 35) + '...' : 
              (product.name || 'Produto sem nome'),
            product.code || '-',
            (product.currentBalance || 0).toFixed(2),
            product.countedBalance !== null && product.countedBalance !== undefined ? 
              product.countedBalance.toFixed(2) : '-',
            product.difference !== null && product.difference !== undefined ? 
              (product.difference > 0 ? '+' : '') + product.difference.toFixed(2) : '-',
            product.unit || 'un'
          ];

          rowData.forEach((data, index) => {
            try {
              pdf.rect(startX, currentY - 5, colWidths[index], 10);
              pdf.text(String(data), startX + 2, currentY);
              startX += colWidths[index];
            } catch (cellError) {
              console.warn('⚠️ Error adding cell data:', cellError);
            }
          });
          currentY += 10;
        });
      } catch (tableError) {
        console.error('❌ Error adding products table:', tableError);
        throw new Error('Falha ao adicionar tabela de produtos');
      }

      try {
        currentY += 20;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Assinaturas:', 20, currentY);
        currentY += 20;

        pdf.setFont('helvetica', 'normal');
        pdf.text('Responsável pela Contagem: _________________________', 20, currentY);
        currentY += 15;
        pdf.text('Supervisor: _________________________', 20, currentY);
        currentY += 15;
        pdf.text('Data: ___/___/______', 20, currentY);

        // Add footer with CloudBPO branding
        currentY = pageHeight - 20;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text('© 2025 CloudBPO - Sistema de Gestão Financeira', pageWidth / 2, currentY, { align: 'center' });
      } catch (signatureError) {
        console.error('❌ Error adding signature section:', signatureError);
      }

      try {
        const filename = `CloudBPO_Contagem_${counting.internalId || counting.id.substring(0, 8)}_${format(new Date(), 'ddMMyyyy')}.pdf`;
        pdf.save(filename);
        console.log('✅ PDF generated successfully:', filename);
      } catch (saveError) {
        console.error('❌ Error saving PDF:', saveError);
        throw new Error('Falha ao salvar arquivo PDF');
      }
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      
      let errorMessage = 'Erro ao gerar PDF. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Tente novamente.';
      }
      
      alert(errorMessage);
    }
  };

  const exportToExcel = async (counting: CountingWithDetails, config: ExcelExportConfig) => {
    try {
      console.log('🔄 Exporting to Excel with config:', config);
      
      const countingWithData = await loadCountingDataForExport(counting);
      
      const products = countingWithData.products || [];
      const excelData: (string | number)[][] = [];

      const headers: string[] = [];
      if (config.includeColumns.product) headers.push('Produto');
      if (config.includeColumns.code) headers.push('Código');
      if (config.includeColumns.currentBalance) headers.push('Saldo Atual');
      if (config.includeColumns.countedBalance) headers.push('Saldo Contado');
      if (config.includeColumns.difference) headers.push('Diferença');
      if (config.includeColumns.unit) headers.push('Unidade');
      if (config.includeColumns.notes) headers.push('Observações');

      excelData.push(headers);

      products.forEach(product => {
        const row: (string | number)[] = [];
        
        if (config.includeColumns.product) row.push(product.name);
        if (config.includeColumns.code) row.push(product.code || '');
        if (config.includeColumns.currentBalance) {
          const value = formatNumberForExcel(product.currentBalance, config);
          row.push(value);
        }
        if (config.includeColumns.countedBalance) {
          const value = product.countedBalance ? formatNumberForExcel(product.countedBalance, config) : '';
          row.push(value);
        }
        if (config.includeColumns.difference) {
          const value = product.difference ? formatNumberForExcel(product.difference, config) : '';
          row.push(value);
        }
        if (config.includeColumns.unit) row.push(product.unit || '');
        if (config.includeColumns.notes) row.push(product.notes || '');

        excelData.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      const formatDateForExcel = (date: Date) => {
        try {
          switch (config.dateFormat) {
            case 'dd/MM/yyyy':
              return format(date, 'dd/MM/yyyy', { locale: ptBR });
            case 'MM/dd/yyyy':
              return format(date, 'MM/dd/yyyy', { locale: ptBR });
            case 'yyyy-MM-dd':
              return format(date, 'yyyy-MM-dd', { locale: ptBR });
            default:
              return format(date, 'dd/MM/yyyy', { locale: ptBR });
          }
        } catch (error) {
          console.error('Error formatting date for Excel:', error);
          return format(date, 'dd/MM/yyyy', { locale: ptBR });
        }
      };

      const infoData = [
        ['CloudBPO - Informações da Contagem'],
        ['ID', counting.internalId || 'N/A'],
        ['Nome', counting.name],
        ['Status', getStatusBadge(counting).label],
        ['Funcionário', counting.employee_name || 'Não atribuído'],
        ['Data Agendada', counting.scheduledDate ? formatDateForExcel(new Date(counting.scheduledDate)) : 'N/A'],
        ['Horário', counting.scheduledTime || 'Flexível'],
        ['Criado em', formatDateForExcel(new Date(counting.createdAt)) + ' ' + format(new Date(counting.createdAt), 'HH:mm', { locale: ptBR })]
      ];

      const infoWs = XLSX.utils.aoa_to_sheet(infoData);

      XLSX.utils.book_append_sheet(wb, infoWs, 'Informações');
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

      const filename = `CloudBPO_Contagem_${counting.internalId || counting.id.substring(0, 8)}_${format(new Date(), 'ddMMyyyy')}.xlsx`;
      XLSX.writeFile(wb, filename);

      console.log('✅ Excel exported successfully:', filename);
      
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      alert('Erro ao exportar para Excel. Tente novamente.');
    }
  };

  const formatNumberForExcel = (num: number, config: ExcelExportConfig): string => {
    let formatted = num.toFixed(2);
    
    if (config.decimalSeparator === ',') {
      formatted = formatted.replace('.', ',');
    }
    
    const parts = formatted.split(config.decimalSeparator);
    if (parts[0].length > 3 && config.thousandsSeparator) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    }
    
    return parts.join(config.decimalSeparator);
  };

  const loadCountingDataForExport = async (counting: CountingWithDetails): Promise<Record<string, unknown>> => {
    try {
      console.log('🔄 Loading counting data for export:', counting.id);

      if (!counting || !counting.id || !counting.companyId) {
        throw new Error('Dados da contagem inválidos para exportação');
      }

      const { data: productsData, error: productsError } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('company_id', counting.companyId);

      if (productsError) {
        console.error('❌ Error loading products:', productsError);
        throw productsError;
      }

      const possibleTables = [
        'app_0bcfd220f3_counting_items',
        'counting_items',
        'app_0bcfd220f3_counted_items',
        'counted_items'
      ];

      let countedData = [];
      for (const tableName of possibleTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('counting_id', counting.id);

          if (!error && data) {
            countedData = data;
            console.log(`✅ Found counted items in table: ${tableName}`, data.length);
            break;
          }
        } catch (tableError) {
          console.log(`⚠️ Table ${tableName} not accessible`);
        }
      }

      const sectorIds: string[] = [];
      try {
        const { data: countingData } = await supabase
          .from(TABLES.COUNTINGS)
          .select('sector_id, description')
          .eq('id', counting.id)
          .single();

        if (countingData?.sector_id) {
          sectorIds.push(countingData.sector_id);
        }

        if (countingData?.description) {
          try {
            const parsed = JSON.parse(countingData.description);
            if (parsed.sector_ids && Array.isArray(parsed.sector_ids)) {
              sectorIds.push(...parsed.sector_ids);
            }
          } catch (e) {
            console.log('Description is not valid JSON');
          }
        }
      } catch (error) {
        console.log('Error loading counting sectors:', error);
      }

      let filteredProducts = productsData || [];
      if (sectorIds.length > 0) {
        filteredProducts = (productsData || []).filter(product => 
          product.sector_id && sectorIds.includes(product.sector_id)
        );
      }

      console.log(`📊 Products for export: ${filteredProducts.length} (filtered from ${productsData?.length || 0})`);

      const products = filteredProducts.map(product => {
        const countedItem = countedData.find(item => item.product_id === product.id);
        const currentBalance = product.current_stock || product.quantity || 0;
        const countedBalance = countedItem ? (countedItem.counted_quantity || countedItem.quantity || 0) : null;
        const difference = countedItem && countedBalance !== null ? (countedBalance - currentBalance) : null;

        return {
          id: product.id,
          name: product.name || 'Produto sem nome',
          code: product.code || '',
          unit: product.unit || 'un',
          currentBalance,
          countedBalance,
          difference,
          notes: countedItem?.notes || '',
          isCounted: !!countedItem
        };
      });

      console.log(`✅ Export data prepared: ${products.length} products`);
      return { ...counting, products };
      
    } catch (error) {
      console.error('❌ Error loading counting data for export:', error);
      return { ...counting, products: [] };
    }
  };

  const checkAndUpdateExpiredCountings = async () => {
    if (!authState.company?.id) return;
    
    try {
      const now = new Date();
      let hasUpdates = false;
      
      const updatedCountings = await Promise.all(
        countings.map(async (counting) => {
          if (['completed', 'approved', 'expired'].includes(counting.status)) {
            return counting;
          }
          
          if (counting.scheduledDate && counting.scheduledTime) {
            const scheduledDateTime = new Date(`${counting.scheduledDate}T${counting.scheduledTime}`);
            
            if (isAfter(now, scheduledDateTime) && counting.status !== 'expired') {
              console.log(`🔄 Marking counting ${counting.id} (${counting.name}) as expired - overdue by ${differenceInHours(now, scheduledDateTime)}h`);
              
              try {
                await supabase
                  .from(TABLES.COUNTINGS)
                  .update({ status: 'expired' })
                  .eq('id', counting.id);
                
                hasUpdates = true;
                return { ...counting, status: 'expired' as const };
              } catch (error) {
                console.error(`❌ Error updating counting ${counting.id} to expired:`, error);
                return counting;
              }
            }
          }
          
          return counting;
        })
      );
      
      if (hasUpdates) {
        console.log('✅ Updated expired countings, reloading...');
        setCountings(updatedCountings);
        await loadCountings();
      }
      
    } catch (error) {
      console.error('❌ Error checking expired countings:', error);
    }
  };

  const loadCountings = async (page = 1, append = false) => {
    if (!authState.company?.id) return;
    
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      console.log(`🔄 Loading countings for company (page ${page}):`, authState.company.id);
      
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const { data, error } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('company_id', authState.company.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (error) {
        console.error('❌ Error loading countings:', error);
        throw error;
      }
      
      console.log('✅ Countings loaded:', data?.length || 0);
      
      const countingsData = (data || []).map(counting => ({
        id: counting.id,
        internalId: counting.internal_id,
        name: counting.name,
        title: counting.title,
        description: counting.description,
        status: counting.status,
        companyId: counting.company_id,
        createdBy: counting.created_by,
        employee_name: counting.employee_name || null,
        whatsappNumber: counting.whatsapp_number || null,
        sectors: [],
        scheduledDate: counting.scheduled_date,
        scheduledTime: counting.scheduled_time,
        startedAt: counting.started_at,
        completedAt: counting.completed_at,
        approvedAt: counting.approved_at,
        expiresAt: counting.expires_at,
        mobileLink: counting.mobile_link,
        createdAt: counting.created_at,
        updatedAt: counting.updated_at
      }));
      
      if (append) {
        setCountings(prev => [...prev, ...countingsData]);
      } else {
        setCountings(countingsData);
      }
      
      setHasMore(data.length === ITEMS_PER_PAGE);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('❌ Error loading countings:', error);
      alert('Erro ao carregar contagens. Verifique a conexão com o banco de dados.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreCountings = async () => {
    if (!hasMore || loadingMore) return;
    await loadCountings(currentPage + 1, true);
  };

  const loadSectors = async () => {
    if (!authState.company?.id) return;
    
    try {
      console.log('🔄 Loading sectors for company:', authState.company.id);
      const { data, error } = await supabase
        .from(TABLES.SECTORS)
        .select('*')
        .eq('company_id', authState.company.id)
        .order('name');
      
      if (error) {
        console.error('❌ Error loading sectors:', error);
        throw error;
      }
      
      console.log('✅ Sectors loaded:', data?.length || 0);
      
      const sectorsData = (data || []).map(sector => ({
        id: sector.id,
        name: sector.name,
        description: sector.description,
        companyId: sector.company_id,
        createdAt: sector.created_at,
        updatedAt: sector.updated_at
      }));
      
      setSectors(sectorsData);
    } catch (error) {
      console.error('❌ Error loading sectors:', error);
      alert('Erro ao carregar setores. Verifique a conexão com o banco de dados.');
    }
  };

  const loadCountingDetails = async (counting: CountingWithDetails) => {
    try {
      console.log('🔄 Loading counting details for:', counting.id);
      setSelectedCounting(counting);
      setShowDetails(true);
    } catch (error) {
      console.error('❌ Error loading counting details:', error);
      alert('Erro ao carregar detalhes da contagem.');
    }
  };

  const loadCountingSectors = async (countingId: string): Promise<string[]> => {
    try {
      console.log('🔄 Loading sectors for counting:', countingId);
      
      const { data: countingData } = await supabase
        .from(TABLES.COUNTINGS)
        .select('sector_id, description')
        .eq('id', countingId)
        .single();

      const sectorIds: string[] = [];

      if (countingData?.sector_id) {
        sectorIds.push(countingData.sector_id);
      }

      if (countingData?.description) {
        try {
          const parsed = JSON.parse(countingData.description);
          if (parsed.sector_ids && Array.isArray(parsed.sector_ids)) {
            sectorIds.push(...parsed.sector_ids);
          }
        } catch (e) {
          console.log('Description is not valid JSON');
        }
      }

      console.log('✅ Sectors loaded for counting:', sectorIds);
      return [...new Set(sectorIds)];
    } catch (error) {
      console.error('❌ Error loading counting sectors:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authState.company?.id || !authState.user?.id) {
      alert('Erro: Usuário ou empresa não identificados.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Nome da contagem é obrigatório.');
      return;
    }

    if (formData.sectorIds.length === 0) {
      alert('Selecione pelo menos um setor.');
      return;
    }

    if (!formData.employeeName.trim()) {
      alert('Nome do funcionário é obrigatório.');
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      alert('Número do WhatsApp é obrigatório.');
      return;
    }

    try {
      setFormLoading(true);
      
      console.log('🔍 DEBUGGING SECTOR SELECTION:');
      console.log('📋 formData.sectorIds BEFORE submit:', formData.sectorIds);
      console.log('📊 Number of sectors selected:', formData.sectorIds.length);
      console.log('📝 Sector names:', formData.sectorIds.map(id => {
        const sector = sectors.find(s => s.id === id);
        return sector ? sector.name : 'Unknown';
      }));
      
      if (editingCounting) {
        console.log('🔄 UPDATING existing counting:', editingCounting.id);
        
        const sectorData = {
          sector_ids: formData.sectorIds,
          selected_sectors: formData.sectorIds
        };
        
        const updateData = {
          name: formData.name.trim(),
          description: JSON.stringify(sectorData),
          scheduled_date: formData.scheduledDate || null,
          scheduled_time: formData.scheduledTime || null,
          employee_name: formData.employeeName.trim(),
          whatsapp_number: formData.whatsappNumber.trim(),
          sector_id: formData.sectorIds[0],
          updated_at: new Date().toISOString()
        };

        console.log('✅ Update data prepared:', updateData);
        console.log('🔍 Sectors being saved in description:', sectorData);

        const { error } = await supabase
          .from(TABLES.COUNTINGS)
          .update(updateData)
          .eq('id', editingCounting.id);

        if (error) {
          console.error('❌ Error updating counting:', error);
          throw error;
        }

        console.log('✅ Counting updated successfully with ALL sectors');
        setShowForm(false);
        setEditingCounting(null);
        resetForm();
        await loadCountings();
        setSuccessMessage('Contagem atualizada com sucesso!');
        setShowSuccessDialog(true);
        
      } else {
        console.log('🔄 CREATING new counting with ALL SECTORS:', {
          name: formData.name,
          companyId: authState.company.id,
          createdBy: authState.user.id,
          sectorIds: formData.sectorIds,
          scheduledDate: formData.scheduledDate || null,
          scheduledTime: formData.scheduledTime || null,
          employeeName: formData.employeeName,
          whatsappNumber: formData.whatsappNumber
        });

        const { data: lastCounting } = await supabase
          .from(TABLES.COUNTINGS)
          .select('internal_id')
          .eq('company_id', authState.company.id)
          .not('internal_id', 'is', null)
          .order('internal_id', { ascending: false })
          .limit(1);
        
        let internalId = '001';
        if (lastCounting && lastCounting.length > 0) {
          const lastInternalId = lastCounting[0].internal_id;
          if (lastInternalId) {
            const nextNumber = parseInt(lastInternalId) + 1;
            internalId = nextNumber.toString().padStart(3, '0');
          }
        }

        const countingUuid = crypto.randomUUID();
        const mobileLink = `${window.location.origin}/mobile/counting/${countingUuid}`;

        let expiresAt: Date;
        if (formData.scheduledDate && formData.scheduledTime) {
          const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
          expiresAt = new Date(scheduledDateTime.getTime() + (24 * 60 * 60 * 1000));
        } else if (formData.scheduledDate) {
          const scheduledDate = new Date(`${formData.scheduledDate}T23:59:59`);
          expiresAt = new Date(scheduledDate.getTime() + (24 * 60 * 60 * 1000));
        } else {
          expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
        }

        const sectorData = {
          sector_ids: formData.sectorIds,
          selected_sectors: formData.sectorIds
        };

        const insertData = {
          internal_id: internalId,
          name: formData.name.trim(),
          description: JSON.stringify(sectorData),
          company_id: authState.company.id,
          created_by: authState.user.id,
          status: 'in_progress',
          scheduled_date: formData.scheduledDate || null,
          scheduled_time: formData.scheduledTime || null,
          employee_name: formData.employeeName.trim(),
          whatsapp_number: formData.whatsappNumber.trim(),
          mobile_link: mobileLink,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          sector_id: formData.sectorIds[0]
        };

        console.log('✅ Dados preparados para inserção com TODOS OS SETORES:', insertData);
        console.log('🔍 Sectors being saved in description:', sectorData);
        console.log('📊 Total sectors to be saved:', formData.sectorIds.length);

        const { data, error } = await supabase
          .from(TABLES.COUNTINGS)
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating counting:', error);
          throw error;
        }

        console.log('✅ Counting created successfully with ALL SECTORS:', data);
        console.log('🎯 Verification - sectors saved:', JSON.parse(data.description || '{}'));

        const actualMobileLink = `${window.location.origin}/mobile/counting/${data.id}`;
        await supabase
          .from(TABLES.COUNTINGS)
          .update({ mobile_link: actualMobileLink })
          .eq('id', data.id);

        const result = {
          id: data.id,
          internalId: data.internal_id,
          name: data.name,
          description: data.description,
          status: data.status,
          companyId: data.company_id,
          createdBy: data.created_by,
          employee_name: data.employee_name,
          whatsappNumber: data.whatsapp_number,
          sectorIds: formData.sectorIds,
          scheduledDate: data.scheduled_date,
          scheduledTime: data.scheduled_time,
          startedAt: data.started_at,
          completedAt: data.completed_at,
          approvedAt: data.approved_at,
          expiresAt: data.expires_at,
          mobileLink: actualMobileLink,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };

        setCreatedCounting(result);
        setShowForm(false);
        setShowWhatsAppModal(true);
        resetForm();
        await loadCountings();
      }

    } catch (error) {
      console.error('❌ Error saving counting:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('JWT')) {
          alert('Erro de autenticação. Faça login novamente.');
        } else if (error.message.includes('permission')) {
          alert('Sem permissão para realizar esta operação.');
        } else {
          alert(`Erro ao salvar contagem: ${error.message}`);
        }
      } else {
        alert('Erro desconhecido ao salvar contagem. Tente novamente.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (counting: Counting) => {
    console.log('🔄 Loading counting for edit:', counting.id);
    
    const countingSectorIds = await loadCountingSectors(counting.id);
    
    setEditingCounting(counting);
    setFormData({
      name: counting.name || '',
      description: counting.description || '',
      sectorIds: countingSectorIds,
      scheduledDate: counting.scheduledDate || '',
      scheduledTime: counting.scheduledTime || '',
      employeeName: counting.employee_name || '',
      whatsappNumber: counting.whatsappNumber || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta contagem?')) return;

    try {
      console.log('🔄 Deleting counting:', id);
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('✅ Counting deleted successfully');
      await loadCountings();
      setSuccessMessage('Contagem excluída com sucesso!');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('❌ Error deleting counting:', error);
      alert('Erro ao excluir contagem. Tente novamente.');
    }
  };

  const handleStartCounting = async (counting: Counting) => {
    try {
      console.log('🔄 Starting counting:', counting.id);
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', counting.id);
      
      if (error) throw error;
      
      console.log('✅ Counting started successfully');
      await loadCountings();
    } catch (error) {
      console.error('❌ Error starting counting:', error);
      alert('Erro ao iniciar contagem.');
    }
  };

  const handleFinalizeCounting = async (counting: Counting) => {
    setSelectedCounting(counting as CountingWithDetails);
    setShowFinalizeDialog(true);
  };

  const confirmFinalizeCounting = async () => {
    if (!selectedCounting) return;

    try {
      console.log('🔄 Finalizing counting as EXPIRED:', selectedCounting.id);
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update({
          status: 'expired',
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedCounting.id);
      
      if (error) throw error;
      
      console.log('✅ Counting finalized as expired successfully');
      await loadCountings();
      setShowFinalizeDialog(false);
      setSelectedCounting(null);
      setSuccessMessage('Contagem finalizada como expirada com sucesso!');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('❌ Error finalizing counting:', error);
      alert('Erro ao finalizar contagem. Tente novamente.');
    }
  };

  const handleExtendTime = async (counting: Counting) => {
    setSelectedCounting(counting as CountingWithDetails);
    setShowExtendTimeDialog(true);
  };

  const confirmExtendTime = async () => {
    if (!selectedCounting) return;

    try {
      console.log('🔄 Extending counting time:', selectedCounting.id);
      
      if (selectedCounting.status === 'expired') {
        console.log('🔄 Reactivating expired counting to in_progress');
        const newDateTime = addHours(new Date(), extendHours);
        const { error } = await supabase
          .from(TABLES.COUNTINGS)
          .update({
            status: 'in_progress',
            scheduled_date: format(newDateTime, 'yyyy-MM-dd'),
            scheduled_time: format(newDateTime, 'HH:mm')
          })
          .eq('id', selectedCounting.id);
        
        if (error) throw error;
        
        setSuccessMessage(`Contagem reativada com ${extendHours} horas adicionais!`);
      } else {
        const currentExpiration = new Date(selectedCounting.expiresAt || new Date());
        const newExpiration = new Date(currentExpiration.getTime() + (extendHours * 60 * 60 * 1000));
        
        const { error } = await supabase
          .from(TABLES.COUNTINGS)
          .update({
            expires_at: newExpiration.toISOString()
          })
          .eq('id', selectedCounting.id);
        
        if (error) throw error;
        
        setSuccessMessage(`Prazo estendido em ${extendHours} horas com sucesso!`);
      }
      
      console.log('✅ Counting time extended successfully');
      await loadCountings();
      setShowExtendTimeDialog(false);
      setSelectedCounting(null);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('❌ Error extending counting time:', error);
      alert('Erro ao estender prazo da contagem.');
    }
  };

  const handleApproveCounting = async (countingId: string) => {
    try {
      console.log('🔄 Approving counting and generating movements:', countingId);
      
      if (!authState.company?.id || !authState.user?.id) {
        throw new Error('Usuário ou empresa não identificados');
      }

      const { data: countingData, error: countingError } = await supabase
        .from(TABLES.COUNTINGS)
        .select('*')
        .eq('id', countingId)
        .single();

      if (countingError || !countingData) {
        throw new Error('Contagem não encontrada');
      }

      console.log('✅ Contagem encontrada:', countingData.name);

      const { data: countingItems, error: itemsError } = await supabase
        .from('app_0bcfd220f3_counting_items')
        .select('*')
        .eq('counting_id', countingId);

      if (itemsError) {
        console.error('❌ Erro ao buscar itens contados:', itemsError);
        throw itemsError;
      }

      console.log(`✅ Itens contados encontrados: ${countingItems?.length || 0}`);

      const productIds = (countingItems || []).map(item => item.product_id);
      
      const movementsToCreate: Record<string, unknown>[] = [];
      
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from(TABLES.PRODUCTS)
          .select('*')
          .in('id', productIds);

        if (productsError) {
          console.error('❌ Erro ao buscar produtos:', productsError);
          throw productsError;
        }

        console.log(`✅ Produtos encontrados: ${productsData?.length || 0}`);

        const productsToUpdate = [];

        for (const item of countingItems || []) {
          const product = productsData?.find(p => p.id === item.product_id);
          
          if (product) {
            const currentStock = product.current_stock || 0;
            const countedQuantity = item.counted_quantity || item.quantity || 0;
            const difference = countedQuantity - currentStock;

            console.log(`📊 Produto ${product.name}: ${currentStock} → ${countedQuantity} (${difference > 0 ? '+' : ''}${difference})`);

            if (difference !== 0) {
              movementsToCreate.push({
                product_id: item.product_id,
                movement_type: 'counting_approved',
                quantity_before: currentStock,
                quantity_after: countedQuantity,
                user_id: authState.user.id,
                notes: `Contagem aprovada - ID: ${countingData.internal_id || countingId.substring(0, 8)}`,
                reference_id: countingId,
                company_id: authState.company.id,
                created_at: new Date().toISOString()
              });

              productsToUpdate.push({
                id: item.product_id,
                current_stock: countedQuantity
              });
            }
          }
        }

        console.log(`📈 Movimentações a criar: ${movementsToCreate.length}`);
        console.log(`📦 Produtos a atualizar: ${productsToUpdate.length}`);

        if (movementsToCreate.length > 0) {
          const { error: movementsError } = await supabase
            .from(TABLES.STOCK_MOVEMENTS)
            .insert(movementsToCreate);

          if (movementsError) {
            console.error('❌ Erro ao criar movimentações:', movementsError);
            throw movementsError;
          }

          console.log('✅ Movimentações criadas com sucesso!');
        }

        for (const productUpdate of productsToUpdate) {
          const { error: updateError } = await supabase
            .from(TABLES.PRODUCTS)
            .update({ current_stock: productUpdate.current_stock })
            .eq('id', productUpdate.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar produto:', updateError);
            throw updateError;
          }
        }

        console.log('✅ Estoques atualizados com sucesso!');
      }

      const { error: approveError } = await supabase
        .from(TABLES.COUNTINGS)
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', countingId);
      
      if (approveError) {
        console.error('❌ Erro ao aprovar contagem:', approveError);
        throw approveError;
      }
      
      console.log('✅ Contagem aprovada com sucesso!');
      
      await loadCountings();
      setShowDetails(false);
      setSelectedCounting(null);
      setSuccessMessage(`Contagem aprovada com sucesso! ${movementsToCreate.length} movimentações geradas.`);
      setShowSuccessDialog(true);
      
    } catch (error) {
      console.error('❌ Error approving counting:', error);
      alert(`Erro ao aprovar contagem: ${(error as Error).message || 'Tente novamente'}`);
    }
  };

  const handleReopenCounting = async (counting: Counting) => {
    if (!confirm('Tem certeza que deseja reabrir esta contagem para ajustes?')) return;

    try {
      console.log('🔄 Reopening counting:', counting.id);
      const { error } = await supabase
        .from(TABLES.COUNTINGS)
        .update({
          status: 'in_progress',
          expires_at: addHours(new Date(), 2).toISOString()
        })
        .eq('id', counting.id);
      
      if (error) throw error;
      
      console.log('✅ Counting reopened successfully');
      await loadCountings();
    } catch (error) {
      console.error('❌ Error reopening counting:', error);
      alert('Erro ao reabrir contagem.');
    }
  };

  const generateWhatsAppMessage = (counting: Counting) => {
    const employeeName = counting.employee_name || '';
    const countingName = counting.name || '';
    const countingId = counting.internalId || '';
    const scheduledDate = counting.scheduledDate 
      ? format(new Date(counting.scheduledDate), 'dd/MM/yyyy', { locale: ptBR }) 
      : '';
    const scheduledTime = counting.scheduledTime || '';
    const mobileLink = counting.mobileLink || '';
    
    return `NOVA CONTAGEM DE ESTOQUE

Funcionario: ${employeeName}
Nome: ${countingName}
ID Contagem: ${countingId}
Prazo abaixo:
Data: ${scheduledDate}\t\t\tHorario: ${scheduledTime}

Link para contagem:
${mobileLink}

IMPORTANTE: Acesse o link pelo celular para realizar a contagem.`;
  };

  const handleSendWhatsApp = (counting: Counting) => {
    const whatsappNumber = counting.whatsappNumber || '';
    const message = generateWhatsAppMessage(counting);

    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sectorIds: [],
      scheduledDate: '',
      scheduledTime: '',
      employeeName: '',
      whatsappNumber: ''
    });
  };

  const getStatusBadge = (counting: Counting) => {
    switch (counting.status) {
      case 'completed':
        return { label: 'Concluída', color: 'bg-green-100 text-green-800' };
      case 'in_progress':
        return { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved':
        return { label: 'Aprovada', color: 'bg-green-100 text-green-800' };
      case 'expired':
        return { label: 'Expirada', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Pendente', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getRemainingTime = (counting: Counting) => {
    if (counting.status === 'approved') {
      return { text: '-', color: 'text-gray-500' };
    }

    if (counting.status === 'completed') {
      return { text: 'Concluída', color: 'text-green-600' };
    }

    if (counting.status === 'expired') {
      return { text: 'Expirada', color: 'text-red-600 font-medium' };
    }

    if (!counting.scheduledDate || !counting.scheduledTime) {
      if (!counting.expiresAt) {
        return { text: 'Sem prazo', color: 'text-gray-500' };
      }
      
      const now = new Date();
      const expiresAt = new Date(counting.expiresAt);

      if (isAfter(now, expiresAt)) {
        return { text: 'Expirada', color: 'text-red-600 font-medium' };
      }

      const hoursRemaining = differenceInHours(expiresAt, now);
      const minutesRemaining = differenceInMinutes(expiresAt, now);
      const daysRemaining = differenceInDays(expiresAt, now);
      
      if (daysRemaining > 0) {
        return { 
          text: `${daysRemaining}d restantes`, 
          color: daysRemaining <= 1 ? 'text-orange-600' : 'text-blue-600' 
        };
      } else if (hoursRemaining > 0) {
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
    }

    const now = new Date();
    const scheduledDateTime = new Date(`${counting.scheduledDate}T${counting.scheduledTime}`);

    if (isAfter(now, scheduledDateTime)) {
      if (counting.status !== 'expired' && counting.status !== 'completed' && counting.status !== 'approved') {
        setTimeout(async () => {
          try {
            console.log(`🔄 Auto-updating overdue counting ${counting.id} to expired status`);
            await supabase
              .from(TABLES.COUNTINGS)
              .update({ status: 'expired' })
              .eq('id', counting.id);
            loadCountings();
          } catch (error) {
            console.error('❌ Error auto-updating counting to expired:', error);
          }
        }, 100);
      }

      const hoursOverdue = differenceInHours(now, scheduledDateTime);
      const daysOverdue = differenceInDays(now, scheduledDateTime);
      
      if (daysOverdue > 0) {
        return { 
          text: `${daysOverdue}d atrasada`, 
          color: 'text-red-600 font-medium' 
        };
      } else {
        return { 
          text: `${hoursOverdue}h atrasada`, 
          color: 'text-red-600 font-medium' 
        };
      }
    } else {
      const hoursRemaining = differenceInHours(scheduledDateTime, now);
      const minutesRemaining = differenceInMinutes(scheduledDateTime, now);
      const daysRemaining = differenceInDays(scheduledDateTime, now);
      
      if (daysRemaining > 0) {
        return { 
          text: `${daysRemaining}d restantes`, 
          color: daysRemaining <= 1 ? 'text-orange-600' : 'text-blue-600' 
        };
      } else if (hoursRemaining > 0) {
        return { 
          text: `${hoursRemaining}h restantes`, 
          color: hoursRemaining <= 2 ? 'text-orange-600' : 'text-blue-600' 
        };
      } else {
        return { 
          text: `${minutesRemaining}min restantes`, 
          color: 'text-red-600 font-medium' 
        };
      }
    }
  };

  const canReopen = (counting: Counting) => {
    if (counting.status !== 'completed') return false;
    const completedAt = new Date(counting.completedAt || '');
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCompletion <= 24;
  };

  const filteredCountings = countings.filter(counting => {
    const name = counting.name || '';
    const internalId = counting.internalId || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counting.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || counting.status === statusFilter;
    const matchesDate = !dateFilter || counting.scheduledDate?.includes(dateFilter);
    const matchesEmployee = !employeeFilter || counting.employee_name?.toLowerCase().includes(employeeFilter.toLowerCase());
    const matchesSector = !sectorFilter || counting.sectors?.some(s => s.id === sectorFilter);

    return matchesSearch && matchesStatus && matchesDate && matchesEmployee && matchesSector;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando contagens...</div>
      </div>
    );
  }

  if (showDetails && selectedCounting) {
    return (
      <CountingDetailModal
        counting={selectedCounting}
        onClose={() => {
          setShowDetails(false);
          setSelectedCounting(null);
        }}
        onApprove={handleApproveCounting}
        onExtendTime={handleExtendTime}
      />
    );
  }

  return (
    <div className="p-4 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contagens de Estoque</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Contagem
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
            <option value="approved">Aprovada</option>
            <option value="expired">Expirada</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Filtrar por data"
          />

          <input
            type="text"
            placeholder="Filtrar por funcionário..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Setores</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Nome
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Data
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Horário
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Tempo Restante
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Funcionário
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  WhatsApp
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCountings.map((counting) => {
                const statusBadge = getStatusBadge(counting);
                const remainingTime = getRemainingTime(counting);
                
                return (
                  <tr key={counting.id} className={`hover:bg-gray-50 ${counting.status === 'expired' ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                        {counting.internalId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      <div className="max-w-[150px]">
                        <div className="font-medium truncate">{counting.name}</div>
                        {counting.description && (
                          <div className="text-xs text-gray-500 truncate">{counting.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {counting.scheduledDate 
                        ? format(parseISO(counting.scheduledDate), 'dd/MM/yy', { locale: ptBR })
                        : 'N/A'
                      }
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {counting.scheduledTime || 'Flex'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={remainingTime.color}>
                        {remainingTime.text}
                      </span>
                      {counting.status === 'expired' && (
                        <div className="text-xs text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Tempo esgotado
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="max-w-[120px] truncate">
                        {counting.employee_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {counting.whatsappNumber ? 'Sim' : 'Não'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button
                          onClick={() => loadCountingDetails(counting)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => generatePDF(counting)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Gerar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCounting(counting);
                            setShowExcelExportModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Exportar Excel"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {counting.status === 'pending' && (
                          <button
                            onClick={() => handleStartCounting(counting)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Iniciar contagem"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        {counting.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleExtendTime(counting)}
                              className="text-orange-600 hover:text-orange-900 p-1"
                              title="Adicionar tempo"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleFinalizeCounting(counting)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Finalizar contagem"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {counting.status === 'expired' && (
                          <button
                            onClick={() => handleExtendTime(counting)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Reativar contagem"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {canReopen(counting) && (
                          <button
                            onClick={() => handleReopenCounting(counting)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Reabrir para ajustes"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSendWhatsApp(counting)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Enviar por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEdit(counting)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(counting.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCountings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma contagem encontrada.</p>
          </div>
        )}

        {hasMore && filteredCountings.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={loadMoreCountings}
              disabled={loadingMore}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  Carregando...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais contagens
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showExcelExportModal && selectedCounting && (
        <ExcelExportModal
          counting={selectedCounting}
          onClose={() => {
            setShowExcelExportModal(false);
            setSelectedCounting(null);
          }}
          onExport={(config) => exportToExcel(selectedCounting, config)}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingCounting ? 'Editar Contagem' : 'Nova Contagem'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCounting(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={formLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Contagem *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Contagem Mensal - Janeiro 2024"
                  disabled={formLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição adicional sobre a contagem..."
                  disabled={formLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Funcionário *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: João Silva"
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: (11) 99999-9999"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setores * ({sectors.length} disponíveis)
                </label>
                {sectors.length === 0 ? (
                  <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Nenhum setor encontrado. Cadastre setores primeiro na tela de Setores.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {sectors.map((sector) => (
                      <label key={sector.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.sectorIds.includes(sector.id)}
                          onChange={(e) => {
                            setFormData(prev => {
                              if (e.target.checked) {
                                return {
                                  ...prev,
                                  sectorIds: [...prev.sectorIds, sector.id]
                                };
                              } else {
                                return {
                                  ...prev,
                                  sectorIds: prev.sectorIds.filter(id => id !== sector.id)
                                };
                              }
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={formLoading}
                        />
                        <span className="text-sm text-gray-700">{sector.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {formData.sectorIds.length === 0 && sectors.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">Selecione pelo menos um setor</p>
                )}
                {formData.sectorIds.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ {formData.sectorIds.length} setor(es) selecionado(s)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Agendada
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={formLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCounting(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading || formData.sectorIds.length === 0 || !formData.name.trim() || !formData.employeeName.trim() || !formData.whatsappNumber.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    editingCounting ? 'Atualizar' : 'Criar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Dialog open={showExtendTimeDialog} onOpenChange={setShowExtendTimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              {selectedCounting?.status === 'expired' ? 'Reativar Contagem' : 'Adicionar Tempo à Contagem'}
            </DialogTitle>
            <DialogDescription>
              {selectedCounting?.status === 'expired' 
                ? 'Quantas horas você deseja para reativar esta contagem expirada?'
                : 'Quantas horas você deseja adicionar ao prazo da contagem?'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas para {selectedCounting?.status === 'expired' ? 'reativação' : 'adicionar'}
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={extendHours}
                onChange={(e) => setExtendHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendTimeDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmExtendTime}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {selectedCounting?.status === 'expired' ? 'Reativar' : 'Adicionar Tempo'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="w-5 h-5 text-red-600" />
              Finalizar Contagem
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja finalizar esta contagem? Esta ação irá marcar a contagem como expirada.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFinalizeDialog(false)}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmFinalizeCounting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Finalizar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Sucesso
            </DialogTitle>
            <DialogDescription>
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <button
              onClick={() => setShowSuccessDialog(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {showWhatsAppModal && createdCounting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-800">Contagem Criada!</h2>
                  <p className="text-sm text-green-600">Compartilhe com o funcionário</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWhatsAppModal(false);
                  setCreatedCounting(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Detalhes da Contagem</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Nome:</span> {createdCounting.name}</div>
                  <div><span className="font-medium">ID:</span> {createdCounting.internalId}</div>
                  <div><span className="font-medium">Funcionário:</span> {createdCounting.employee_name}</div>
                  <div><span className="font-medium">WhatsApp:</span> {createdCounting.whatsappNumber}</div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Mensagem WhatsApp
                </h4>
                <div className="bg-white rounded-lg p-3 border text-sm whitespace-pre-line text-gray-700">
                  {generateWhatsAppMessage(createdCounting)}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Link para Contagem Mobile</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={createdCounting.mobileLink || ''}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded bg-white font-mono"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(createdCounting.mobileLink || '')}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setCreatedCounting(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleCopyToClipboard(generateWhatsAppMessage(createdCounting));
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Mensagem
                </button>
                <button
                  onClick={() => {
                    handleSendWhatsApp(createdCounting);
                    setShowWhatsAppModal(false);
                    setCreatedCounting(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Countings;