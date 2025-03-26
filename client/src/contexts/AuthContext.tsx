import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, type AuthUser } from '@/lib/auth';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check for current user on mount
    auth.getCurrentUser()
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));

    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChange(async (authUser) => {
      if (authUser) {
        try {
          const user = await auth.getCurrentUser();
          setUser(user);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to get user'));
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 