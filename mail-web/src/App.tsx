import { Button, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { websiteConfig } from '@/api/setting';
import { loginUserInfo } from '@/api/my';
import { useAppStore } from '@/store/app-store';
import { hasPerm } from '@/lib/permissions';
import LoginPage from '@/pages/LoginPage';
import MailPage from '@/pages/MailPage';
import DraftsPage from '@/pages/DraftsPage';
import SettingsPage from '@/pages/SettingsPage';
import ManagementPage from '@/pages/ManagementPage';
import AnalysisPage from '@/pages/AnalysisPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SystemSettingsPage from '@/pages/SystemSettingsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';

function useBootstrap() {
  const [loading, setLoading] = useState(true);
  const setSettings = useAppStore((state) => state.setSettings);
  const setDomainList = useAppStore((state) => state.setDomainList);
  const setUser = useAppStore((state) => state.setUser);
  const setCurrentAccount = useAppStore((state) => state.setCurrentAccount);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const token = localStorage.getItem('token');
        const config: any = await websiteConfig();
        if (!mounted) return;

        setSettings(config || {});
        setDomainList(config?.domainList || []);
        document.title = config?.title || 'Cloud Mail';

        if (token) {
          const user: any = await loginUserInfo().catch(() => null);
          if (user && mounted) {
            setUser(user);
            setCurrentAccount(user.account || null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [setCurrentAccount, setDomainList, setSettings, setUser]);

  return loading;
}

function Protected({ children, perm }: { children: ReactElement; perm?: string | string[] }) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (perm && !hasPerm(perm)) {
    return <Navigate replace to="/inbox" />;
  }

  return children;
}

function AppEffects() {
  const { i18n } = useTranslation();
  const lang = useAppStore((state) => state.lang);
  const dark = useAppStore((state) => state.dark);

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('mail-lang', lang);
  }, [i18n, lang]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.dataset.theme = dark ? 'dark' : 'light';
    document.getElementById('theme-color-meta')?.setAttribute('content', dark ? '#171717' : '#f5f5f5');
  }, [dark]);

  return null;
}

function BootScreen() {
  const title = useAppStore((state) => state.settings?.title) || 'Cloud Mail';
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <div className="text-sm font-medium text-muted">{title}</div>
      </div>
    </div>
  );
}

export default function App() {
  const loading = useBootstrap();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const routes = useMemo(
    () => [
      { path: '/inbox', element: <MailPage kind="inbox" /> },
      { path: '/sent', element: <MailPage kind="sent" />, perm: 'email:send' },
      { path: '/starred', element: <MailPage kind="starred" /> },
      { path: '/important', element: <MailPage kind="important" /> },
      { path: '/spam', element: <MailPage kind="spam" /> },
      { path: '/folder/:folderId', element: <MailPage kind="folder" /> },
      { path: '/drafts', element: <DraftsPage />, perm: 'email:send' },
      { path: '/message', element: <MailPage kind="inbox" forceDetail /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/subscriptions', element: <SubscriptionPage /> },
      { path: '/all-mail', element: <MailPage kind="all-mail" />, perm: 'all-email:query' },
      { path: '/all-users', element: <ManagementPage resource="users" />, perm: 'user:query' },
      { path: '/role', element: <ManagementPage resource="roles" />, perm: 'role:query' },
      { path: '/invite-code', element: <ManagementPage resource="regKeys" />, perm: 'reg-key:query' },
      { path: '/system-setting', element: <SystemSettingsPage />, perm: 'setting:query' },
      { path: '/analysis', element: <AnalysisPage />, perm: 'analysis:query' },
    ],
    [],
  );

  if (loading) return <BootScreen />;

  return (
    <>
      <AppEffects />
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<Navigate replace to={token ? '/inbox' : '/login'} />} path="/" />
        {routes.map((route) => (
          <Route
            key={route.path}
            element={<Protected perm={route.perm}>{route.element}</Protected>}
            path={route.path}
          />
        ))}
        <Route
          element={
            <div className="flex h-screen items-center justify-center">
              <Button onPress={() => navigate('/inbox')}>Home</Button>
            </div>
          }
          path="/test"
        />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </>
  );
}
