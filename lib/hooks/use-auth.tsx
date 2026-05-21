'use client';

import { apiFetch } from '@/lib/api/client';

import React, { createContext, useContext, useState } from 'react';

export interface SessionData {
  id: string;
  username: string;
  role: string;
  fullName: string;
}

interface SessionContextType {
  session: SessionData | null;
  isLoading: boolean;
  isError: any;
  isAuthenticated: boolean;
  mutate: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ 
  children, 
  initialSession 
}: { 
  children: React.ReactNode; 
  initialSession: SessionData | null; 
}) {
  const [session, setSession] = useState<SessionData | null>(initialSession);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<any>(null);

  const mutate = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (err) {
      setIsError(err);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{
      session,
      isLoading,
      isError,
      isAuthenticated: !!session,
      mutate
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession phải được đặt bên trong SessionProvider');
  }
  return context;
}
