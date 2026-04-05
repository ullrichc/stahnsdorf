'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type AuthState = {
  user: User | null;
  isEditor: boolean;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthState>({
  user: null,
  isEditor: false,
  loading: true,
  error: null,
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
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, isEditor: false, loading: false, error: null });
        return;
      }

      // Whitelist check: config/editors/{email}
      try {
        const editorDoc = await getDoc(
          doc(db, 'editors', user.email ?? '')
        );
        if (editorDoc.exists()) {
          setState({ user, isEditor: true, loading: false, error: null });
        } else {
          setState({
            user,
            isEditor: false,
            loading: false,
            error: 'Zugriff verweigert. Dieser Account ist nicht als Editor freigeschaltet.',
          });
        }
      } catch (err: any) {
        setState({
          user,
          isEditor: false,
          loading: false,
          error: 'Zugriff verweigert. Dieser Account ist nicht als Editor freigeschaltet.',
        });
      }
    });

    return () => unsubscribe();
  }, []);

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
    return (
      <div className="admin-auth-denied">
        <h2>🚫 Zugriff verweigert</h2>
        <p>{state.error}</p>
        <p className="admin-auth-email">{state.user.email}</p>
        <button onClick={() => signOut(auth)} className="admin-btn-secondary">
          Mit anderem Konto anmelden
        </button>
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
        <h1>🌲 Südwestkirchhof</h1>
        <h2>Redaktionswerkzeug</h2>
        <p>Melde dich an, um POIs zu bearbeiten.</p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="admin-btn-google"
        >
          {loading ? 'Anmelden…' : '🔑 Anmelden'}
        </button>
        {error && <p className="admin-auth-error">{error}</p>}
      </div>
    </div>
  );
}
