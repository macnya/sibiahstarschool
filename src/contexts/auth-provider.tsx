
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthError, UserCredential } from 'firebase/auth';
import {
  getAdditionalUserInfo
} from 'firebase/auth';
import {
  auth,
  createUserWithEmailPassword as firebaseCreateUserWithEmailPassword,
  signInWithEmailPassword as firebaseSignInWithEmailPassword,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  handleAuthStateChange
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define the specific admin email
const HARDCODED_ADMIN_EMAIL = "macb1738@gmail.com";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  initialLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  registerWithEmailAndPassword: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const { toast } = useToast();

  const setAdminStatus = async (currentUser: User | null) => {
    if (currentUser) {
      if (currentUser.email === HARDCODED_ADMIN_EMAIL) {
        console.warn(`AuthProvider: User ${HARDCODED_ADMIN_EMAIL} detected, granting client-side admin status. This is for development/testing only and is NOT secure for production.`);
        setIsAdmin(true);
      } else {
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh for latest claims
          setIsAdmin(idTokenResult.claims.isAdmin === true);
        } catch (error) {
          console.error("Error fetching custom claims for user:", currentUser.email, error);
          setIsAdmin(false);
        }
      }
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = handleAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      await setAdminStatus(currentUser);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setAuthActionLoading(true);
    try {
      const userCredential = await firebaseSignInWithEmailPassword(email, pass);
      if (userCredential.user) {
        await setAdminStatus(userCredential.user); // Check admin status after login
        toast({ title: 'Login Successful', description: 'Welcome back!', variant: 'default' });
        return true;
      }
      setIsAdmin(false); // Should not be reached if successful
      return false;
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
      const userCredential = await firebaseCreateUserWithEmailPassword(email, pass);
      if (userCredential.user) {
        await setAdminStatus(userCredential.user); // Check admin status after registration
        toast({ title: 'Registration Successful', description: 'Welcome! Your account has been created.', variant: 'default' });
        return true;
      }
      return false;
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
      const userCredential: UserCredential = await firebaseSignInWithGoogle();
      const additionalInfo = getAdditionalUserInfo(userCredential);
      const isNewUser = additionalInfo?.isNewUser;

      if (userCredential.user) {
        await setAdminStatus(userCredential.user); // Check admin status after Google sign-in
      }

      if (isNewUser) {
        toast({
          title: 'Google Sign-Up Successful!',
          description: 'Welcome! Your account has been created.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Google Sign-In Successful!',
          description: 'Welcome back!',
          variant: 'default',
        });
      }
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error('Google Sign-In error:', authError);
      let description = authError.message || 'Could not sign in with Google. Please try again.';
      if (authError.code === 'auth/popup-closed-by-user') {
        description = 'Sign-in process was cancelled. Please try again.';
      } else if (authError.code === 'auth/account-exists-with-different-credential') {
        description = 'An account already exists with this email address using a different sign-in method. Please sign in using that method.';
      }
      toast({
        title: 'Google Sign-In Failed',
        description,
        variant: 'destructive',
      });
      setIsAdmin(false);
      return false;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const logout = async () => {
    setAuthActionLoading(true);
    try {
      await firebaseSignOut();
      setUser(null); // Explicitly set user to null
      setIsAdmin(false); // Reset admin status on logout
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
