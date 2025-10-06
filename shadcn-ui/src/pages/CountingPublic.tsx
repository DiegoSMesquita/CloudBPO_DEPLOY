import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { db } from '@/lib/database';
import { Counting, Product, CountingItem } from '@/lib/types';
import { toast } from 'sonner';

export default function CountingPublicPage() {
  const { shareLink } = useParams<{ shareLink: string }>();
  const navigate = useNavigate();
  const [counting, setCounting] = useState<Counting | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [countingItems, setCountingItems] = useState<CountingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shareLink) {
      loadCounting();
    }
  }, [shareLink]);

  const loadCounting = async () => {
    if (!shareLink) return;

    try {
      setLoading(true);
      
      // Load counting by share link
      const loadedCounting = await db.getCountingByShareLinkAsync(shareLink);
      
      if (!loadedCounting) {
        toast.error('Contagem não encontrada ou link inválido');
        navigate('/login');
        return;
      }

      setCounting(loadedCounting);
      
      // Load products for this company
      const loadedProducts = await db.getProductsAsync(loadedCounting.companyId);
      setProducts(loadedProducts);
      
      // Initialize counting items
      setCountingItems(loadedCounting.items || []);
      
      console.log('✅ Public counting loaded:', loadedCounting);
    } catch (error) {
      console.error('❌ Error loading public counting:', error);
      toast.error('Erro ao carregar contagem');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const handleQuantityChange = (itemId: string, countedQuantity: number) => {
    setCountingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const difference = countedQuantity - item.expectedQuantity;
        return {
          ...item,
          countedQuantity,
          difference
        };
      }
      return item;
    }));
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setCountingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, notes };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!counting) return;

    try {
      setSaving(true);
      
      const updatedCounting: Counting = {
        ...counting,
        items: countingItems,
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      await db.saveCountingAsync(updatedCounting);
      
      toast.success('Contagem salva com sucesso!');
      
      // Redirect to a success page or show completion message
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error saving counting:', error);
      toast.error('Erro ao salvar contagem');
    } finally {
      setSaving(false);
    }
  };

  const getDifferenceColor = (difference: number | undefined) => {
    if (difference === undefined || difference === 0) return 'text-gray-600';
    return difference > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getDifferenceBadge = (difference: number | undefined) => {
    if (difference === undefined) return null;
    if (difference === 0) return <Badge variant="secondary">OK</Badge>;
    if (difference > 0) return <Badge variant="default" className="bg-green-100 text-green-800">+{difference}</Badge>;
    return <Badge variant="destructive">{difference}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contagem...</p>
        </div>
      </div>
    );
  }

  if (!counting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contagem não encontrada</h1>
          <p className="text-gray-600 mb-4">O link pode estar inválido ou a contagem foi removida.</p>
          <Button onClick={() => navigate('/login')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  const completedItems = countingItems.filter(item => item.countedQuantity !== undefined).length;
  const totalItems = countingItems.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <ClipboardList className="h-8 w-8 mr-3 text-blue-600" />
                {counting.name}
              </h1>
              <p className="text-gray-600">{counting.description}</p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Progresso</div>
              <div className="text-2xl font-bold text-blue-600">
                {completedItems}/{totalItems}
              </div>
              <div className="text-sm text-gray-500">
                {progress.toFixed(0)}% concluído
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Counting Items */}
        <Card>
          <CardHeader>
            <CardTitle>Itens para Contagem</CardTitle>
            <CardDescription>
              Insira a quantidade contada para cada produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Esperado</TableHead>
                    <TableHead>Contado</TableHead>
                    <TableHead>Diferença</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countingItems.map((item) => {
                    const product = getProductById(item.productId);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{product?.name || 'Produto não encontrado'}</div>
                              <div className="text-sm text-gray-500">{product?.unit}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.expectedQuantity}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.countedQuantity || ''}
                            onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-20"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${getDifferenceColor(item.difference)}`}>
                            {getDifferenceBadge(item.difference)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.id, e.target.value)}
                            placeholder="Observações..."
                            className="min-h-[60px] resize-none"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/login')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sair
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || progress < 100}
            className="min-w-[120px]"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Finalizar Contagem'}
          </Button>
        </div>

        {progress < 100 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <ClipboardList className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                Complete a contagem de todos os itens antes de finalizar.
              </p>
            </div>
          </div>
        )}

        {progress === 100 && counting.status !== 'completed' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">
                Contagem completa! Clique em "Finalizar Contagem" para salvar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}