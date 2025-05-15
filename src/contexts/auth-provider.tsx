
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // True initially for auth state check
  const [authActionLoading, setAuthActionLoading] = useState(false); // For login/logout actions
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        variant: 'default',
      });
      setAuthActionLoading(false);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      toast({
        title: 'Login Failed',
        description: authError.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
      setAuthActionLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setAuthActionLoading(true);
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
        variant: 'default',
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Logout error:', authError);
      toast({
        title: 'Logout Failed',
        description: authError.message || 'Could not log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAuthActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading: authActionLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
