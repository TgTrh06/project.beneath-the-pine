import { useEffect, useRef, useState } from 'react';
import { initializeAuth, subscribeToAuth, logout, type AuthSession } from '../shared/auth/auth';
import { useHashRouter } from './router';

/** Owns session initialization, intended destination and account-navigation transitions. */
export function useAppSession() {
  const pendingRoute = useRef<string | null>(null);
  const { route, navigate } = useHashRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuth(setSession);
    setChecking(true);
    void initializeAuth().then(value => {
      if (active) { setSession(value); setNotice(''); }
    }).catch(() => setNotice('Chưa thể kết nối dịch vụ tài khoản.'))
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; unsubscribe(); };
  }, [retry]);
  useEffect(() => {
    if (!session && !['landing', 'login', 'register'].includes(route.view)) pendingRoute.current = route.id ? `${route.view}/${route.id}` : route.view;
    if (route.view === 'landing') pendingRoute.current = null;
  }, [route, session]);
  useEffect(() => { if (route.view === 'invite') setNotice(''); }, [route.view, route.id]);
  const signOut = () => void logout().then(() => {
    pendingRoute.current = null; navigate('landing');
  }).catch(() => setNotice('Chưa thể đăng xuất.'));
  const retryConnection = () => setRetry(value => value + 1);
  const authenticated = () => {
    setNotice(''); const destination = pendingRoute.current ?? 'return';
    pendingRoute.current = null; navigate(destination);
  };
  return { route, navigate, session, checking, notice, setNotice, signOut, retryConnection, authenticated };
}
