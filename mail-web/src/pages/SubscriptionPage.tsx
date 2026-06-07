import { Avatar, Button, Spinner } from '@heroui/react';
import { BookOpen, Mail, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subscriptionDelete, subscriptionList } from '@/api/subscription';
import { colorFor, initials } from '@/lib/utils';
import { notifySuccess } from '@/lib/notify';
import { useAppStore } from '@/store/app-store';
import AppSidebar from '@/components/AppSidebar';
import Composer from '@/components/Composer';
import type { Subscription } from '@/types';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Subscription[]>([]);

  async function load() {
    setLoading(true);
    try {
      const data: any = await subscriptionList();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(sub: Subscription) {
    await subscriptionDelete(sub.subscriptionId);
    setItems((current) => current.filter((s) => s.subscriptionId !== sub.subscriptionId));
    notifySuccess(t('delSuccessMsg'));
  }

  return (
    <div className="mail-shell" data-sidebar-collapsed={sidebarCollapsed}>
      <div
        className="sidebar-backdrop"
        data-open={sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
      <AppSidebar />
      <div className="mail-list-pane" style={{ flex: 1 }}>
        <section className="flex h-full flex-col">
          <div className="flex items-center gap-3 p-4 pb-2">
            <button
              aria-label="Open sidebar"
              className="icon-button sidebar-open-button"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <BookOpen className="size-5" />
            </button>
            <h1 className="text-xl font-semibold">{t('subscriptions')}</h1>
          </div>

          <div className="flex-1 overflow-auto px-4 py-3">
            {loading ? (
              <div className="flex h-40 items-center justify-center"><Spinner /></div>
            ) : items.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted">
                <Mail className="size-10 opacity-30" />
                <p>{t('noSubscriptions')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((sub) => (
                  <div
                    className="flex items-center gap-4 rounded-2xl bg-surface px-4 py-3 shadow-sm"
                    key={sub.subscriptionId}
                  >
                    <Avatar
                      className="size-12 text-foreground"
                      style={{ background: colorFor(sub.senderEmail) }}
                    >
                      <Avatar.Fallback>{initials(sub.name || sub.senderEmail)}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{sub.name || sub.senderEmail}</div>
                      <div className="truncate text-sm text-muted">{sub.senderEmail}</div>
                      {sub.emailCount ? (
                        <div className="text-xs text-muted">{t('emailCount', { total: sub.emailCount })}</div>
                      ) : null}
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="outline"
                      onPress={() => handleDelete(sub)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <Composer />
    </div>
  );
}
