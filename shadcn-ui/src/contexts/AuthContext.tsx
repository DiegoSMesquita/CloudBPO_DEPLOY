import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, AuthState } from '@/lib/types';
import { db } from '@/lib/database';

interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCompany: (company: Company) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Session timeout: 1 hour (3600000 milliseconds)
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    company: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  // Update last activity timestamp
  const updateLastActivity = () => {
    localStorage.setItem('cloudBPO_lastActivity', Date.now().toString());
  };

  // Check if session is expired
  const isSessionExpired = (): boolean => {
    const lastActivity = localStorage.getItem('cloudBPO_lastActivity');
    if (!lastActivity) return true;
    
    const timeDiff = Date.now() - parseInt(lastActivity);
    return timeDiff > SESSION_TIMEOUT;
  };

  // Auto logout on session expiry - only check on page load/refresh
  const checkSessionExpiry = () => {
    if (authState.isAuthenticated && isSessionExpired()) {
      console.log('Session expired, logging out...');
      logout();
    }
  };

  useEffect(() => {
    // Check session on mount
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('cloudBPO_user');
        const savedCompany = localStorage.getItem('cloudBPO_company');
        
        if (savedUser && savedCompany) {
          // Check if session is expired only on initial load
          if (isSessionExpired()) {
            console.log('Session expired on load, clearing...');
            clearSession();
            setLoading(false);
            return;
          }

          const user: User = JSON.parse(savedUser);
          const company: Company = JSON.parse(savedCompany);
          
          // Verify user still exists in database - USE ASYNC METHODS
          const dbUser = await db.getUserByIdAsync(user.id);
          const dbCompany = await db.getCompanyByIdAsync(company.id);
          
          if (dbUser && dbCompany) {
            setAuthState({
              user: dbUser,
              company: dbCompany,
              isAuthenticated: true,
            });
            updateLastActivity();
            console.log('✅ Session restored successfully');
          } else {
            // Clear invalid session
            console.log('❌ User or company not found in database, clearing session');
            clearSession();
          }
        } else {
          // No saved session
          clearSession();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up activity listeners to update last activity (but don't auto-logout)
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (authState.isAuthenticated) {
        updateLastActivity();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Only check session expiry on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && authState.isAuthenticated) {
        checkSessionExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check session expiry on page focus (when user comes back to window)
    const handleFocus = () => {
      if (authState.isAuthenticated) {
        checkSessionExpiry();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [authState.isAuthenticated]);

  const clearSession = () => {
    localStorage.removeItem('cloudBPO_user');
    localStorage.removeItem('cloudBPO_company');
    localStorage.removeItem('cloudBPO_lastActivity');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', email);
      
      // Find user by email in Supabase - USE ASYNC METHOD
      const user = await db.getUserByEmailAsync(email);
      console.log('User found in database:', user ? 'YES' : 'NO');
      
      if (!user) {
        console.log('❌ User not found in database');
        return false;
      }

      // Check password
      let isValidPassword = false;

      console.log('=== PASSWORD VALIDATION ===');
      console.log('User stored password:', user.password ? '***' : 'NO PASSWORD');
      console.log('Provided password:', password ? '***' : 'NO PASSWORD');

      // Exact password match
      if (user.password && user.password === password) {
        console.log('✅ Password matches stored password');
        isValidPassword = true;
      }
      // Super admin specific check
      else if (user.email === 'superadmin@cloudbpo.com' && password === 'admin123') {
        console.log('✅ Super admin password correct');
        isValidPassword = true;
      }

      if (!isValidPassword) {
        console.log('❌ Password validation failed');
        return false;
      }

      console.log('=== COMPANY LOOKUP ===');
      // Get user's company from Supabase - USE ASYNC METHOD
      let company = await db.getCompanyByIdAsync(user.companyId);
      console.log('Primary company:', company);
      
      // If user has accessibleCompanies, check if they can access any company
      if (!company && user.accessibleCompanies && user.accessibleCompanies.length > 0) {
        company = await db.getCompanyByIdAsync(user.accessibleCompanies[0]);
        console.log('Using first accessible company:', company);
      }
      
      // Super admin can access any company - USE ASYNC METHOD
      if (!company && user.email === 'superadmin@cloudbpo.com') {
        const companies = await db.getCompaniesAsync();
        company = companies.length > 0 ? companies[0] : null;
        console.log('Super admin using any available company:', company);
      }
      
      if (!company) {
        console.log('❌ No accessible company found');
        return false;
      }

      console.log('=== LOGIN SUCCESS ===');
      const newAuthState = {
        user,
        company,
        isAuthenticated: true,
      };
      
      setAuthState(newAuthState);
      
      // Save to localStorage with timestamp
      localStorage.setItem('cloudBPO_user', JSON.stringify(user));
      localStorage.setItem('cloudBPO_company', JSON.stringify(company));
      updateLastActivity();
      
      console.log('✅ Login successful');
      return true;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      company: null,
      isAuthenticated: false,
    });
    
    clearSession();
    console.log('User logged out');
  };

  const setCompany = async (company: Company): Promise<boolean> => {
    try {
      if (authState.user) {
        // Check if user has access to this company
        const hasAccess = 
          authState.user.companyId === company.id ||
          (authState.user.accessibleCompanies && authState.user.accessibleCompanies.includes(company.id)) ||
          authState.user.email === 'superadmin@cloudbpo.com';

        if (!hasAccess) {
          console.error('User does not have access to this company');
          return false;
        }

        // Update auth state
        const newAuthState = {
          user: authState.user,
          company: company,
          isAuthenticated: true,
        };
        
        setAuthState(newAuthState);
        
        // Save to localStorage
        localStorage.setItem('cloudBPO_company', JSON.stringify(company));
        updateLastActivity();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting company:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, setCompany, loading }}>
      {children}
    </AuthContext.Provider>
  );
};