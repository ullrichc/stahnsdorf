'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import AppIcon from '@/components/AppIcon';

type AuthState = {
  user: User | null;
  isEditor: boolean;
  loading: boolean;
  error: string | null;
  errorKind: 'denied' | 'retryable' | null;
};

const AuthContext = createContext<AuthState>({
  user: null,
  isEditor: false,
  loading: true,
  error: null,
  errorKind: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isEditor: false,
    loading: true,
    error: null,
    errorKind: null,
  });

  const verifyEditor = useCallback(async (user: User) => {
    setState({ user, isEditor: false, loading: true, error: null, errorKind: null });
    try {
      const editorDoc = await getDoc(doc(db, 'editors', user.email ?? ''));
      if (editorDoc.exists()) {
        setState({ user, isEditor: true, loading: false, error: null, errorKind: null });
      } else {
        setState({
          user,
          isEditor: false,
          loading: false,
          error: 'Zugriff verweigert. Dieser Account ist nicht als Editor freigeschaltet.',
          errorKind: 'denied',
        });
      }
    } catch (err: any) {
      const denied = err?.code === 'permission-denied' || err?.code === 'firestore/permission-denied';
      setState({
        user,
        isEditor: false,
        loading: false,
        error: denied
          ? 'Zugriff verweigert. Die Editor-Berechtigung fehlt.'
          : 'Die Editor-Berechtigung konnte wegen eines Verbindungsfehlers nicht geprüft werden.',
        errorKind: denied ? 'denied' : 'retryable',
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, isEditor: false, loading: false, error: null, errorKind: null });
        return;
      }
      await verifyEditor(user);
    });

    return () => unsubscribe();
  }, [verifyEditor]);

  // Loading
  if (state.loading) {
    return (
      <div className="admin-auth-loading">
        <div className="admin-auth-spinner" />
        <p>Anmeldung wird geprüft…</p>
      </div>
    );
  }

  // Not logged in
  if (!state.user) {
    return <LoginScreen />;
  }

  // Logged in but not editor
  if (!state.isEditor) {
    const retryable = state.errorKind === 'retryable';
    return (
      <div className="admin-auth-denied">
        <h2><AppIcon name="block" style={{ verticalAlign: 'middle', marginRight: '8px' }} />{retryable ? 'Prüfung fehlgeschlagen' : 'Zugriff verweigert'}</h2>
        <p>{state.error}</p>
        <p className="admin-auth-email">{state.user.email}</p>
        {retryable ? (
          <button onClick={() => verifyEditor(state.user!)} className="admin-btn-secondary">
            Erneut versuchen
          </button>
        ) : (
          <button onClick={() => signOut(auth)} className="admin-btn-secondary">
            Mit anderem Konto anmelden
          </button>
        )}
      </div>
    );
  }

  // Authenticated editor
  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError('Anmeldung fehlgeschlagen: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1><AppIcon name="park" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--color-tertiary)' }} />Südwestkirchhof</h1>
        <h2>Redaktionswerkzeug</h2>
        <p>Melde dich an, um POIs zu bearbeiten.</p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="admin-btn-google"
        >
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>
        {error && <p className="admin-auth-error">{error}</p>}
      </div>
    </div>
  );
}
