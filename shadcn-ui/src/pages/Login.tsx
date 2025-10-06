import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, Lock, LogIn, AlertCircle, TrendingUp, BarChart3, PieChart, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
// Import CloudBPO logos
import logoAzul from '@/assets/images/logo-azul.png';
import logoBranco from '@/assets/images/logo-branco.png';
import iconeAzul from '@/assets/images/icone-azul.png';
import iconeBranco from '@/assets/images/icone-branco.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Business Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        
        {/* Animated geometric shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
        </div>

        {/* Business Icons Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 left-32 transform rotate-12">
            <TrendingUp size={60} className="text-white" />
          </div>
          <div className="absolute top-20 right-40 transform -rotate-12">
            <BarChart3 size={50} className="text-white" />
          </div>
          <div className="absolute bottom-40 left-20 transform rotate-45">
            <PieChart size={70} className="text-white" />
          </div>
          <div className="absolute bottom-32 right-32 transform -rotate-6">
            <DollarSign size={55} className="text-white" />
          </div>
          <div className="absolute top-1/2 left-1/4 transform rotate-12">
            <Building2 size={45} className="text-white" />
          </div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
          <div className="max-w-md">
            {/* CloudBPO Logo - White version for dark background */}
            <div className="flex items-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                <img 
                  src={iconeBranco} 
                  alt="CloudBPO Icon" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="ml-4">
                <img 
                  src={logoBranco} 
                  alt="CloudBPO" 
                  className="h-12 object-contain"
                />
                <p className="text-white/80 text-lg mt-1">Financial Solutions</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
              Transforme sua gestão financeira com tecnologia de ponta
            </h2>
            
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              Plataforma completa de BPO financeiro com inteligência artificial, 
              automação avançada e relatórios em tempo real para otimizar seus processos empresariais.
            </p>

            <div className="space-y-4">
              <div className="flex items-center text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
                <span>Automação de processos financeiros</span>
              </div>
              <div className="flex items-center text-white/80">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                <span>Relatórios inteligentes em tempo real</span>
              </div>
              <div className="flex items-center text-white/80">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
                <span>Segurança empresarial avançada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 lg:px-16">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <img 
                    src={iconeBranco} 
                    alt="CloudBPO Icon" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
              </div>
              <img 
                src={logoBranco} 
                alt="CloudBPO" 
                className="h-8 object-contain mx-auto mb-1"
              />
              <p className="text-white/80">Financial Solutions</p>
            </div>

            {/* Login Card */}
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">
                  Acesso ao Sistema
                </CardTitle>
                <CardDescription className="text-white/70">
                  Entre com suas credenciais corporativas
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {error && (
                  <Alert className="bg-red-500/20 border-red-500/50 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4 text-red-300" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90 font-medium">
                      Email Corporativo
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="usuario@empresa.com"
                        className="pl-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/25 backdrop-blur-sm h-12"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90 font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Digite sua senha"
                        className="pl-12 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/25 backdrop-blur-sm h-12"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 h-12 shadow-lg transition-all duration-300 transform hover:scale-[1.02] border-0"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Autenticando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="h-5 w-5" />
                        <span>Entrar no Sistema</span>
                      </div>
                    )}
                  </Button>
                </form>

                <div className="text-center pt-4">
                  <p className="text-white/60 text-sm">
                    Problemas com acesso? Entre em contato com o suporte técnico
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8 space-y-2">
              <p className="text-white/60 text-sm">
                © 2025 CloudBPO. Todos os direitos reservados.
              </p>
              <p className="text-white/40 text-xs">
                Soluções Empresariais em Business Process Outsourcing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}