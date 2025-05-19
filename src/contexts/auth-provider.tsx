
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthError } from 'firebase/auth';
import { 
  auth, 
  createUserWithEmailPassword, 
  signInWithEmailPassword, 
  signInWithGoogle as firebaseSignInWithGoogle, 
  signOut as firebaseSignOut,
  handleAuthStateChange 
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean; // True during async auth operations (login, signup, google sign-in, logout)
  initialLoading: boolean; // True while checking initial auth state
  login: (email: string, pass: string) => Promise<boolean>;
  registerWithEmailAndPassword: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = handleAuthStateChange((currentUser) => {
      setUser(currentUser);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      await signInWithEmailPassword(email, pass);
      toast({ title: 'Login Successful', description: 'Welcome back!', variant: 'default' });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      toast({ title: 'Login Failed', description: authError.message || 'Please check your credentials and try again.', variant: 'destructive' });
      return false;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const registerWithEmailAndPassword = async (email: string, pass: string): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      await createUserWithEmailPassword(email, pass);
      toast({ title: 'Registration Successful', description: 'Welcome! You are now logged in.', variant: 'default' });
      return true; // Firebase automatically signs in the user upon successful registration
    } catch (error) {
      const authError = error as AuthError;
      console.error('Registration error:', authError);
      toast({ title: 'Registration Failed', description: authError.message || 'Could not create account. Please try again.', variant: 'destructive' });
      return false;
    } finally {
      setAuthActionLoading(false);
    }
  };
  
  const signInWithGoogle = async (): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      await firebaseSignInWithGoogle();
      toast({ title: 'Google Sign-In Successful', description: 'Welcome!', variant: 'default' });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Google Sign-In error:', authError);
      toast({ title: 'Google Sign-In Failed', description: authError.message || 'Could not sign in with Google. Please try again.', variant: 'destructive' });
      return false;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const logout = async () => {
    setAuthActionLoading(true);
    try {
      await firebaseSignOut();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.', variant: 'default' });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Logout error:', authError);
      toast({ title: 'Logout Failed', description: authError.message || 'Could not log out. Please try again.', variant: 'destructive' });
    } finally {
      setAuthActionLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading: authActionLoading, initialLoading, login, registerWithEmailAndPassword, signInWithGoogle, logout }}>
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
