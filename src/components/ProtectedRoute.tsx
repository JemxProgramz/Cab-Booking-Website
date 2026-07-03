import { Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (user && !error) {
            setSession(session);
          } else {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setSession(session);
          } else {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Auth state change failed:", error);
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>;
  }

  if (!session) {
    return <Navigate to={{ pathname: '/login', hash: '', search: '' }} replace />;
  }

  return <>{children}</>;
}
