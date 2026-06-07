import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import Composer from '@/components/Composer';
import MessageDetail from '@/components/MessageDetail';
import MessageList from '@/components/MessageList';
import { useAppStore } from '@/store/app-store';
import type { MailboxKind } from '@/types';

export default function MailPage({
  kind,
  forceDetail = false,
}: {
  kind: MailboxKind;
  forceDetail?: boolean;
}) {
  const { folderId: folderIdParam } = useParams<{ folderId?: string }>();
  const folderId = kind === 'folder' ? Number(folderIdParam) || 0 : undefined;

  const selectedEmail = useAppStore((state) => state.selectedEmail.email);
  const selectedEmailContext = useAppStore((state) => state.selectedEmail);
  const selectEmail = useAppStore((state) => state.selectEmail);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const setCurrentFolderId = useAppStore((state) => state.setCurrentFolderId);
  const [mobileDetail, setMobileDetail] = useState(forceDetail);

  useEffect(() => {
    setMobileDetail(forceDetail);
  }, [forceDetail]);

  useEffect(() => {
    if (kind === 'folder' && folderId) {
      setCurrentFolderId(folderId);
    }
  }, [kind, folderId, setCurrentFolderId]);

  if (forceDetail && !selectedEmail) {
    return <Navigate replace to="/inbox" />;
  }

  function closeDetail() {
    setMobileDetail(false);
    selectEmail({ ...selectedEmailContext, email: null });
  }

  return (
    <div className="mail-shell" data-sidebar-collapsed={sidebarCollapsed}>
      <div
        className="sidebar-backdrop"
        data-open={sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
      <AppSidebar />
      <div className="mail-list-pane" data-mobile-hidden={mobileDetail}>
        <MessageList folderId={folderId} kind={kind} onOpenDetail={() => setMobileDetail(true)} />
      </div>
      <main className="mail-detail-pane" data-mobile-hidden={!mobileDetail && window.innerWidth < 760}>
        <MessageDetail email={selectedEmail} onBack={closeDetail} />
      </main>
      <Composer />
    </div>
  );
}
