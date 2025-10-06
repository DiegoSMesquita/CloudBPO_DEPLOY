import React from 'react';
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
    return <Navigate to="/#/login" replace />;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 animate-spin"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <Routes>
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
      
      {/* CRITICAL: Mobile counting routes - public access - HASH ROUTER VERSION */}
      <Route path="/mobile/counting/:countingId" element={<CountingMobile />} />
      <Route path="/mobile/counting/:shareLink" element={<CountingMobile />} />
      <Route path="/counting/:countingId" element={<CountingMobile />} />
      <Route path="/counting/:shareLink" element={<CountingMobile />} />
      
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