import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabase';
import { TasksRealtimeSync } from '../tasks/hooks/TasksRealtimeSync';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** Tracks last known user id so we clear React Query when identity changes (logout or account switch). */
  const prevUserIdRef = useRef<string | undefined>(undefined);

  const applySession = useCallback(
    (currentSession: Session | null) => {
      const newId = currentSession?.user?.id;
      const prevId = prevUserIdRef.current;
      // Logout (newId undefined), account switch, or re-login as different user
      if (prevId !== undefined && newId !== prevId) {
        queryClient.clear();
      }
      prevUserIdRef.current = newId;
      setSession(currentSession);
      setIsLoading(false);
    },
    [queryClient],
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        applySession(initialSession);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      applySession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      <TasksRealtimeSync />
      {children}
    </AuthContext.Provider>
  );
};
