
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
  isAdmin: boolean; // New: to store admin status
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // New: admin state
  const [initialLoading, setInitialLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = handleAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Force refresh of the token to get latest custom claims
          const idTokenResult = await currentUser.getIdTokenResult(true);
          setIsAdmin(idTokenResult.claims.isAdmin === true);
        } catch (error) {
          console.error("Error fetching custom claims:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      const userCredential = await signInWithEmailPassword(email, pass);
      if (userCredential.user) {
        const idTokenResult = await userCredential.user.getIdTokenResult(true);
        setIsAdmin(idTokenResult.claims.isAdmin === true);
      }
      toast({ title: 'Login Successful', description: 'Welcome back!', variant: 'default' });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      setIsAdmin(false);
      toast({ title: 'Login Failed', description: authError.message || 'Please check your credentials and try again.', variant: 'destructive' });
      return false;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const registerWithEmailAndPassword = async (email: string, pass: string): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      // Firebase automatically signs in the user upon successful registration.
      // The onAuthStateChanged listener will then pick up the new user and claims.
      await createUserWithEmailPassword(email, pass);
      toast({ title: 'Registration Successful', description: 'Welcome! You are now logged in.', variant: 'default' });
      // Note: setIsAdmin will be handled by onAuthStateChanged
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Registration error:', authError);
      setIsAdmin(false);
      toast({ title: 'Registration Failed', description: authError.message || 'Could not create account. Please try again.', variant: 'destructive' });
      return false;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      // Similar to registration, onAuthStateChanged will handle user and claims.
      await firebaseSignInWithGoogle();
      toast({ title: 'Google Sign-In Successful', description: 'Welcome!', variant: 'default' });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Google Sign-In error:', authError);
      setIsAdmin(false);
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
      setIsAdmin(false); // Clear admin status on logout
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
    <AuthContext.Provider value={{ user, isAdmin, loading: authActionLoading, initialLoading, login, registerWithEmailAndPassword, signInWithGoogle, logout }}>
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
