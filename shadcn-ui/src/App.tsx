import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import Navbar from '@/components/Navbar';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import ProductsPage from '@/pages/Products';
import SectorsPage from '@/pages/Sectors';
import CountingsPage from '@/pages/Countings';
import CountingMobile from '@/pages/CountingMobile';
import UsersPage from '@/pages/Users';
import CompaniesPage from '@/pages/Companies';
import FinancialPage from '@/pages/Financial';
import MyBPOPage from '@/pages/MyBPO';
import SettingsPage from '@/pages/Settings';

// SOLUÇÃO DEFINITIVA: Componente de redirecionamento para HashRouter
function HashRouterRedirect() {
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    console.log('🔍 HASH REDIRECT: Verificando redirecionamento...');
    console.log('🔍 HASH REDIRECT: Path:', currentPath);
    console.log('🔍 HASH REDIRECT: Hash:', currentHash);
    
    // Se é uma rota mobile sem hash, redirecionar
    const isMobileRoute = currentPath.includes('/mobile/counting/') || currentPath.includes('/counting/');
    const hasProperHash = currentHash.includes('/mobile/counting/') || currentHash.includes('/counting/');
    
    if (isMobileRoute && !hasProperHash) {
      console.log('🚀 HASH REDIRECT: Redirecionando para HashRouter');
      const newHash = '#' + currentPath + window.location.search;
      window.location.replace(window.location.origin + '/' + newHash);
    }
  }, []);

  return null;
}

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Layout component for authenticated pages
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

// App Routes component (inside AuthProvider)
function AppRoutes() {
  const { authState, loading } = useAuth();

  // Para rotas mobile, não esperar loading
  const currentHash = window.location.hash;
  const isMobileRoute = currentHash.includes('/mobile/counting/') || currentHash.includes('/counting/');
  
  if (loading && !isMobileRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <>
      <HashRouterRedirect />
      <Routes>
        {/* ROTAS MOBILE - COMPLETAMENTE PÚBLICAS */}
        <Route path="/mobile/counting/:countingId" element={<CountingMobile />} />
        <Route path="/mobile/counting/:shareLink" element={<CountingMobile />} />
        <Route path="/counting/:countingId" element={<CountingMobile />} />
        <Route path="/counting/:shareLink" element={<CountingMobile />} />
        
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            authState.isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        
        {/* Debug route */}
        <Route path="/debug" element={
          <div className="min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-4">🔍 DEFINITIVO Debug Info</h1>
            <div className="bg-gray-100 p-4 rounded space-y-2">
              <p><strong>Router:</strong> HashRouter</p>
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>Hash:</strong> {window.location.hash}</p>
              <p><strong>Pathname:</strong> {window.location.pathname}</p>
              <p><strong>Auth State:</strong> {authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-4 space-y-2">
              <h2 className="text-lg font-bold">Teste estas URLs em celular novo:</h2>
              <div className="bg-blue-50 p-4 rounded">
                <p className="font-bold text-blue-900">URL Original (404):</p>
                <p className="text-sm text-blue-700 break-all">
                  https://cloudbpov1.mgx.world/mobile/counting/4efa7d4a-e491-439b-b94f-57e2f6c144a4
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="font-bold text-green-900">URL Corrigida (Funciona):</p>
                <p className="text-sm text-green-700 break-all">
                  https://cloudbpov1.mgx.world/#/mobile/counting/4efa7d4a-e491-439b-b94f-57e2f6c144a4
                </p>
              </div>
              <a href="/#/mobile/counting/4efa7d4a-e491-439b-b94f-57e2f6c144a4" className="block bg-green-500 text-white px-4 py-2 rounded text-center">
                Testar Contagem Real
              </a>
            </div>
          </div>
        } />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProductsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sectors"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SectorsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/countings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CountingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mybpo"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MyBPOPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CompaniesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FinancialPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <div className="App">
            <AppRoutes />
            
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
          </div>
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;