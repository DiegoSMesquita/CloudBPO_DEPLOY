import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, TABLES } from '../lib/supabase';
import type { Sector } from '../lib/types';

const Sectors: React.FC = () => {
  const { authState } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (authState.company?.id) {
      loadSectors();
    }
  }, [authState.company]);

  const loadSectors = async () => {
    if (!authState.company?.id) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading sectors for company:', authState.company.id);
      
      // Load sectors using direct Supabase call
      const { data: sectorsData, error: sectorsError } = await supabase
        .from(TABLES.SECTORS)
        .select('*')
        .eq('company_id', authState.company.id)
        .order('name');
      
      if (sectorsError) throw sectorsError;
      
      const mappedSectors = (sectorsData || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        companyId: s.company_id,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));
      
      console.log('✅ Sectors loaded successfully:', mappedSectors.length);
      setSectors(mappedSectors);
      
    } catch (error) {
      console.error('❌ Error loading sectors:', error);
      setSectors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authState.company?.id || !authState.user?.id) {
      alert('Erro: Usuário ou empresa não identificados.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Nome do setor é obrigatório.');
      return;
    }

    try {
      const sectorData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        company_id: authState.company.id
      };

      if (editingSector) {
        const { error } = await supabase
          .from(TABLES.SECTORS)
          .update(sectorData)
          .eq('id', editingSector.id);
        
        if (error) throw error;
        alert('Setor atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from(TABLES.SECTORS)
          .insert(sectorData);
        
        if (error) throw error;
        alert('Setor criado com sucesso!');
      }

      setShowForm(false);
      setEditingSector(null);
      resetForm();
      await loadSectors();
    } catch (error) {
      console.error('❌ Error saving sector:', error);
      alert('Erro ao salvar setor. Tente novamente.');
    }
  };

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name || '',
      description: sector.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor?')) return;

    try {
      const { error } = await supabase
        .from(TABLES.SECTORS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      alert('Setor excluído com sucesso!');
      await loadSectors();
    } catch (error) {
      console.error('❌ Error deleting sector:', error);
      alert('Erro ao excluir setor. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  const filteredSectors = sectors.filter(sector =>
    sector.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Setores</h1>
        <button
          onClick={() => {
            setEditingSector(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Setor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar setores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredSectors.length} de {sectors.length} setores
        </div>
      </div>

      {/* Sectors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSectors.length > 0 ? (
                filteredSectors.map((sector) => (
                  <tr key={sector.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {sector.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {sector.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(sector)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sector.id)}
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
                    {sectors.length === 0 ? 'Nenhum setor encontrado' : 'Nenhum setor corresponde aos filtros aplicados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingSector ? 'Editar Setor' : 'Novo Setor'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSector(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Setor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Almoxarifado, Produção, Escritório"
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
                  placeholder="Descrição opcional do setor..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSector(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSector ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sectors;