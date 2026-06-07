import { Avatar, Button, Dropdown, Label, Modal, Tooltip as HeroTooltip } from '@heroui/react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  ChevronRight,
  Edit2,
  FileText,
  Folder,
  FolderPlus,
  Inbox,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  PenLine,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  Star,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '@/api/login';
import { folderAdd, folderDelete, folderList, folderUpdate } from '@/api/folder';
import { hasPerm } from '@/lib/permissions';
import { initials } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/lib/notify';
import { useAppStore } from '@/store/app-store';
import AccountSelect from '@/components/AccountSelect';
import type { Folder as FolderType } from '@/types';

const Tooltip = HeroTooltip as any;

const avatarGradients = [
  'linear-gradient(135deg, #bae6fd 0%, #6ee7b7 48%, #a78bfa 100%)',
  'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 44%, #4f46e5 100%)',
  'linear-gradient(135deg, #fde68a 0%, #fb923c 48%, #ef4444 100%)',
  'linear-gradient(135deg, #ccfbf1 0%, #22d3ee 44%, #3b82f6 100%)',
  'linear-gradient(135deg, #dcfce7 0%, #4ade80 45%, #059669 100%)',
  'linear-gradient(135deg, #e9d5ff 0%, #c084fc 44%, #db2777 100%)',
  'linear-gradient(135deg, #ffe4e6 0%, #fb7185 46%, #dc2626 100%)',
];

const primaryItems = [
  { path: '/inbox', key: 'inbox', icon: Inbox },
  { path: '/important', key: 'important', icon: AlertCircle },
  { path: '/starred', key: 'starred', icon: Star },
  { path: '/spam', key: 'spam', icon: ShieldAlert },
  { path: '/sent', key: 'sent', icon: Send, perm: 'email:send' },
  { path: '/drafts', key: 'drafts', icon: FileText, perm: 'email:send' },
  { path: '/settings', key: 'settings', icon: Settings },
];

const adminItems = [
  { path: '/analysis', key: 'analytics', icon: BarChart3, perm: 'analysis:query' },
  { path: '/all-users', key: 'allUsers', icon: Users, perm: 'user:query' },
  { path: '/all-mail', key: 'allMail', icon: BookOpen, perm: 'all-email:query' },
  { path: '/role', key: 'permissions', icon: Shield, perm: 'role:query' },
  { path: '/invite-code', key: 'inviteCode', icon: KeyRound, perm: 'reg-key:query' },
  { path: '/system-setting', key: 'SystemSettings', icon: Settings, perm: 'setting:query' },
];

function NavItem({ item }: { item: any }) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const Icon = item.icon;
  const badge = getNavBadge(item.key, user);

  if (item.perm && !hasPerm(item.perm)) return null;

  return (
    <NavLink
      className={({ isActive }) =>
        `sidebar-nav-link mx-4 flex h-11 items-center justify-between rounded-2xl px-4 text-[15px] transition ${
          isActive ? 'bg-surface-secondary font-semibold text-foreground' : 'text-foreground/80 hover:bg-surface'
        }`
      }
      onClick={() => {
        if (window.innerWidth < 1024) setSidebarOpen(false);
      }}
      to={item.path}
    >
      <span className="sidebar-nav-content flex min-w-0 items-center gap-4">
        <Icon className="size-5 shrink-0" />
        <span className="sidebar-label truncate">{t(item.key)}</span>
      </span>
      {badge ? <span className="sidebar-badge text-sm text-muted">{badge}</span> : null}
      <span className="sr-only">{sidebarOpen ? 'open' : 'closed'}</span>
    </NavLink>
  );
}

function getNavBadge(key: string, user: Record<string, any>) {
  const candidates =
    key === 'inbox'
      ? [user.inboxCount, user.unreadCount, user.emailCount]
      : key === 'starred'
        ? [user.starCount, user.starredCount]
        : [];
  const value = candidates.find((item) => Number(item) > 0);
  return value ? Number(value) : null;
}

function avatarGradient(value?: string) {
  const code = [...(value || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarGradients[code % avatarGradients.length];
}

// Colour presets for folder picker
const colorPresets = [
  '#6366f1', '#3b82f6', '#22d3ee', '#10b981', '#84cc16',
  '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#64748b',
];

function FolderItem({ f, onEdit, onDelete }: { f: FolderType; onEdit: (f: FolderType) => void; onDelete: (f: FolderType) => void }) {
  const { t } = useTranslation();
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const setCurrentFolderId = useAppStore((state) => state.setCurrentFolderId);

  return (
    <NavLink
      className={({ isActive }) =>
        `sidebar-nav-link group mx-4 flex h-11 items-center justify-between rounded-2xl px-4 text-[15px] transition ${
          isActive ? 'bg-surface-secondary font-semibold text-foreground' : 'text-foreground/80 hover:bg-surface'
        }`
      }
      onClick={() => {
        setCurrentFolderId(f.folderId);
        if (window.innerWidth < 1024) setSidebarOpen(false);
      }}
      to={`/folder/${f.folderId}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="size-3 shrink-0 rounded-full" style={{ background: f.color }} />
        <span className="truncate">{f.name}</span>
      </span>
      <span className="flex items-center gap-1">
        {f.emailCount ? <span className="text-sm text-muted">{f.emailCount}</span> : null}
        <span className="hidden gap-1 group-hover:flex">
          <button
            className="icon-button size-6 opacity-70 hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(f); }}
            title={t('edit')}
            type="button"
          >
            <Edit2 className="size-3" />
          </button>
          <button
            className="icon-button size-6 text-danger opacity-70 hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(f); }}
            title={t('delete')}
            type="button"
          >
            <Trash2 className="size-3" />
          </button>
        </span>
      </span>
    </NavLink>
  );
}

function FolderManagerModal({
  open,
  editFolder,
  onClose,
  onSaved,
}: {
  open: boolean;
  editFolder: FolderType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editFolder?.name || '');
      setColor(editFolder?.color || '#6366f1');
    }
  }, [open, editFolder]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editFolder) {
        await folderUpdate({ folderId: editFolder.folderId, name, color });
      } else {
        await folderAdd({ name, color });
      }
      notifySuccess(t('saveSuccessMsg'));
      onSaved();
      onClose();
    } catch {
      notifyError(t('reqFailErrorMsg'));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-80 rounded-2xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-semibold">{editFolder ? t('editFolder') : t('addFolder')}</h3>
        <input
          autoFocus
          className="mb-4 w-full rounded-xl border border-separator bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={t('folderName')}
          value={name}
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {colorPresets.map((c) => (
            <button
              key={c}
              className={`size-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1' : ''}`}
              onClick={() => setColor(c)}
              style={{ background: c }}
              type="button"
            />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onPress={onClose}>{t('cancel')}</Button>
          <Button isDisabled={saving} size="sm" onPress={handleSave}>{t('save')}</Button>
        </div>
      </div>
    </div>
  );
}

function DeleteFolderModal({
  folder: f,
  folders,
  onClose,
  onDeleted,
}: {
  folder: FolderType | null;
  folders: FolderType[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const [deleteEmails, setDeleteEmails] = useState<0 | 1>(0);
  const [targetFolderId, setTargetFolderId] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setDeleteEmails(0); setTargetFolderId(0); }, [f]);

  if (!f) return null;

  async function handleDelete() {
    if (!f) return;
    setDeleting(true);
    try {
      await folderDelete({ folderId: f.folderId, deleteEmails, targetFolderId: targetFolderId || 0 });
      notifySuccess(t('delSuccessMsg'));
      onDeleted();
      onClose();
    } catch {
      notifyError(t('reqFailErrorMsg'));
    } finally {
      setDeleting(false);
    }
  }

  const otherFolders = folders.filter((x) => x.folderId !== f.folderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-80 rounded-2xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-base font-semibold">{t('deleteFolderTitle')}</h3>
        <p className="mb-4 text-sm text-muted">{t('deleteFolderDesc', { name: f.name })}</p>
        <div className="mb-3 flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              checked={deleteEmails === 0}
              name="del-emails"
              onChange={() => setDeleteEmails(0)}
              type="radio"
            />
            {t('keepEmails')}
          </label>
          {otherFolders.length > 0 && deleteEmails === 0 && (
            <select
              className="ml-5 rounded-lg border border-separator bg-surface px-2 py-1 text-sm"
              onChange={(e) => setTargetFolderId(Number(e.target.value))}
              value={targetFolderId}
            >
              <option value={0}>{t('noFolder')}</option>
              {otherFolders.map((x) => (
                <option key={x.folderId} value={x.folderId}>{x.name}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2">
            <input
              checked={deleteEmails === 1}
              name="del-emails"
              onChange={() => setDeleteEmails(1)}
              type="radio"
            />
            {t('deleteEmailsToo')}
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onPress={onClose}>{t('cancel')}</Button>
          <Button isDisabled={deleting} size="sm" variant="danger" onPress={handleDelete}>{t('delete')}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const currentAccount = useAppStore((state) => state.currentAccount);
  const dark = useAppStore((state) => state.dark);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const setDark = useAppStore((state) => state.setDark);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);
  const openComposer = useAppStore((state) => state.openComposer);
  const resetSession = useAppStore((state) => state.resetSession);
  const folders = useAppStore((state) => state.folders);
  const setFolders = useAppStore((state) => state.setFolders);

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);

  const loadFolders = useCallback(async () => {
    try {
      const data: any = await folderList();
      setFolders(data || []);
    } catch {
      /* ignore */
    }
  }, [setFolders]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const visibleAdminItems = useMemo(
    () => adminItems.filter((item) => !item.perm || hasPerm(item.perm)),
    [user.permKeys],
  );

  async function handleLogout() {
    await logout().catch(() => null);
    localStorage.removeItem('token');
    resetSession();
    navigate('/login');
  }

  const accountIdentity = currentAccount?.email || user.email;
  const accountFallback = currentAccount?.name || accountIdentity;

  return (
    <aside
      className="mail-sidebar flex h-full flex-col"
      data-collapsed={sidebarCollapsed}
      data-open={sidebarOpen}
    >
      <div className="sidebar-header flex items-center justify-between px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            className="sidebar-account-avatar size-12 text-foreground"
            style={{ background: avatarGradient(accountIdentity) }}
          >
            <Avatar.Fallback>{initials(accountFallback)}</Avatar.Fallback>
          </Avatar>
          <div className="sidebar-user-meta min-w-0">
            <AccountSelect />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="icon-button sidebar-collapse-button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            type="button"
          >
            <Menu className="size-5" />
          </button>
          <button
            aria-label={t('close')}
            className="icon-button sidebar-close-button"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <nav className="mt-3 flex flex-col gap-1 overflow-y-auto flex-1">
        {primaryItems.map((item) => (
          <NavItem item={item} key={item.path} />
        ))}

        {/* Folders section */}
        <div className="mx-6 mt-4 mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted sidebar-label">{t('folders')}</span>
          <button
            className="icon-button size-7 sidebar-label"
            onClick={() => { setEditingFolder(null); setFolderModalOpen(true); }}
            title={t('addFolder')}
            type="button"
          >
            <FolderPlus className="size-4" />
          </button>
        </div>
        {folders.map((f) => (
          <FolderItem
            f={f}
            key={f.folderId}
            onDelete={(x) => setDeletingFolder(x)}
            onEdit={(x) => { setEditingFolder(x); setFolderModalOpen(true); }}
          />
        ))}
        {folders.length === 0 && (
          <p className="sidebar-label mx-8 text-sm text-muted">{t('noFolders')}</p>
        )}

        {/* Subscriptions */}
        <NavLink
          className={({ isActive }) =>
            `sidebar-nav-link mx-4 mt-1 flex h-11 items-center gap-4 rounded-2xl px-4 text-[15px] transition ${
              isActive ? 'bg-surface-secondary font-semibold text-foreground' : 'text-foreground/80 hover:bg-surface'
            }`
          }
          onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
          to="/subscriptions"
        >
          <BookOpen className="size-5 shrink-0" />
          <span className="sidebar-label truncate">{t('subscriptions')}</span>
        </NavLink>

        {visibleAdminItems.length ? (
          <>
            <div className="sidebar-section-separator mx-6 my-3 h-px bg-separator" />
            <div className="sidebar-section-title mb-2 px-6 text-sm font-semibold text-muted sidebar-label">{t('manage')}</div>
            {visibleAdminItems.map((item) => (
              <NavItem item={item} key={item.path} />
            ))}
          </>
        ) : null}
      </nav>

      <div className="sidebar-footer p-6">
        <div className="sidebar-bottom-actions flex items-center gap-2">
          {hasPerm('email:send') ? (
            sidebarCollapsed ? (
              <Tooltip content={t('newEmail')}>
                <button className="icon-button mx-auto" onClick={() => openComposer({ mode: 'new' })} type="button">
                  <PenLine className="size-5" />
                </button>
              </Tooltip>
            ) : (
              <Button className="sidebar-compose-button flex-1" onPress={() => openComposer({ mode: 'new' })}>
                <PenLine className="size-5" />
                {t('newEmail')}
              </Button>
            )
          ) : null}
          <Dropdown>
            <Button
              aria-label={t('moreActions')}
              className="sidebar-more-button shrink-0"
              isIconOnly
              variant="outline"
            >
              <MoreHorizontal className="size-5" />
            </Button>
            <Dropdown.Popover className="min-w-[180px]" placement="top end">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'theme') setDark(!dark);
                  if (key === 'logout') void handleLogout();
                }}
              >
                <Dropdown.Item id="theme" textValue={dark ? t('lightMode') : t('darkMode')}>
                  {dark ? <Sun className="size-4 shrink-0 text-muted" /> : <Moon className="size-4 shrink-0 text-muted" />}
                  <Label>{dark ? t('lightMode') : t('darkMode')}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="logout" textValue={t('logOut')} variant="danger">
                  <LogOut className="size-4 shrink-0 text-danger" />
                  <Label>{t('logOut')}</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <FolderManagerModal
        editFolder={editingFolder}
        onClose={() => setFolderModalOpen(false)}
        onSaved={loadFolders}
        open={folderModalOpen}
      />
      <DeleteFolderModal
        folder={deletingFolder}
        folders={folders}
        onClose={() => setDeletingFolder(null)}
        onDeleted={loadFolders}
      />
    </aside>
  );
}
