import React from 'react';
import { Settings as SettingsIcon, Info, User, Bell, Shield, Palette, Database, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getVersionInfo } from '@/utils/version';

const Settings: React.FC = () => {
  const { authState } = useAuth();
  
  // Get dynamic version information
  const versionInfo = getVersionInfo();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie suas preferências e configurações do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Informações do Usuário</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="text-gray-900 font-medium">{authState.user?.name || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{authState.user?.email || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Função</label>
                <Badge variant="secondary" className="mt-1">
                  {authState.user?.role || 'Usuário'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Empresa Atual</label>
                <p className="text-gray-900 font-medium">{authState.company?.name || 'Nenhuma empresa selecionada'}</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Notificações de Contagem</h3>
                  <p className="text-sm text-gray-600">Receba alertas sobre contagens próximas do prazo</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Notificações por Email</h3>
                  <p className="text-sm text-gray-600">Receba resumos diários por email</p>
                </div>
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Sons de Notificação</h3>
                  <p className="text-sm text-gray-600">Reproduzir sons para alertas importantes</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Aparência</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Densidade da Interface</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="comfortable">Confortável</option>
                  <option value="compact">Compacta</option>
                  <option value="spacious">Espaçosa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Version Information - NOW DYNAMIC */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <SettingsIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Versão em Uso</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Versão Atual:</span>
                <Badge variant="default" className="bg-blue-600 text-white font-semibold">
                  {versionInfo.displayVersion}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Data de Release:</span>
                <span className="text-sm text-gray-600">{versionInfo.releaseDate}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">
                    {versionInfo.isLatest ? 'Sistema Atualizado' : 'Atualização Disponível'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {versionInfo.isLatest 
                    ? 'Você está usando a versão mais recente do CloudBPO'
                    : 'Uma nova versão está disponível para download'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Informações do Sistema</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Última Sincronização:</span>
                <span className="text-gray-900">Agora</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Servidor:</span>
                <span className="text-gray-900">Brasil - SP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Versão Técnica:</span>
                <span className="text-gray-900 font-mono text-xs">{versionInfo.version}</span>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Segurança</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                Alterar Senha
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                Histórico de Login
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                Dispositivos Conectados
              </button>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Ajuda & Suporte</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                Central de Ajuda
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                Contatar Suporte
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">
                Reportar Problema
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default Settings;