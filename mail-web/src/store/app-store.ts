import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Folder, Lang, SelectedEmailContext, User } from '@/types';

type ComposerMode = 'new' | 'reply' | 'forward' | 'draft';

type ComposerState = {
  open: boolean;
  mode: ComposerMode;
  email?: any;
  draft?: any;
};

type AppState = {
  lang: Lang;
  dark: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  accountPanelOpen: boolean;
  settings: any;
  domainList: string[];
  user: User;
  currentAccount: Account | null;
  currentAccountId: number;
  selectedEmail: SelectedEmailContext;
  deleteIds: number[];
  starChangedId: number;
  starChangedValue: 0 | 1;
  sendRecipientRecord: string[];
  composer: ComposerState;
  folders: Folder[];
  currentFolderId: number;
  setLang: (lang: Lang) => void;
  setDark: (dark: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAccountPanelOpen: (open: boolean) => void;
  setSettings: (settings: any) => void;
  setDomainList: (domainList: string[]) => void;
  setUser: (user: User) => void;
  setCurrentAccount: (account: Account | null) => void;
  selectEmail: (selectedEmail: SelectedEmailContext) => void;
  setDeleteIds: (ids: number[]) => void;
  setStarChanged: (id: number, value: 0 | 1) => void;
  addRecipientRecord: (emails: string[]) => void;
  openComposer: (state?: Partial<ComposerState>) => void;
  closeComposer: () => void;
  resetSession: () => void;
  setFolders: (folders: Folder[]) => void;
  setCurrentFolderId: (id: number) => void;
};

const defaultSelectedEmail: SelectedEmailContext = {
  email: null,
  delType: null,
  showStar: true,
  showReply: true,
  showUnread: false,
};

function normalizeAccount(account: Account | null) {
  return account ? { ...account, allReceive: 0 } : null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: navigator.language.startsWith('zh') ? 'zh' : 'en',
      dark: false,
      sidebarOpen: window.innerWidth >= 1024,
      sidebarCollapsed: false,
      accountPanelOpen: window.innerWidth >= 1180,
      settings: {
        r2Domain: '',
        title: 'Cloud Mail',
        loginOpacity: 1,
        loginDarkenFactor: 0,
        autoRefresh: 0,
      },
      domainList: [],
      user: {},
      currentAccount: null,
      currentAccountId: 0,
      selectedEmail: defaultSelectedEmail,
      deleteIds: [],
      starChangedId: 0,
      starChangedValue: 0,
      sendRecipientRecord: [],
      composer: { open: false, mode: 'new' },
      folders: [],
      currentFolderId: 0,
      setLang: (lang) => set({ lang }),
      setDark: (dark) => set({ dark }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setAccountPanelOpen: (accountPanelOpen) => set({ accountPanelOpen }),
      setSettings: (settings) => set({ settings }),
      setDomainList: (domainList) => set({ domainList }),
      setUser: (user) => set({ user }),
      setCurrentAccount: (account) => {
        const currentAccount = normalizeAccount(account);
        set({ currentAccount, currentAccountId: currentAccount?.accountId || 0 });
      },
      selectEmail: (selectedEmail) => set({ selectedEmail }),
      setDeleteIds: (deleteIds) => set({ deleteIds }),
      setStarChanged: (starChangedId, starChangedValue) => set({ starChangedId, starChangedValue }),
      addRecipientRecord: (emails) => {
        const current = get().sendRecipientRecord.filter((email) => !emails.includes(email));
        set({ sendRecipientRecord: [...emails, ...current].slice(0, 500) });
      },
      openComposer: (state) =>
        set({ composer: { open: true, mode: 'new', ...state } as ComposerState }),
      closeComposer: () => set({ composer: { open: false, mode: 'new' } }),
      resetSession: () =>
        set({
          user: {},
          currentAccount: null,
          currentAccountId: 0,
          selectedEmail: defaultSelectedEmail,
          deleteIds: [],
          folders: [],
          currentFolderId: 0,
        }),
      setFolders: (folders) => set({ folders }),
      setCurrentFolderId: (currentFolderId) => set({ currentFolderId }),
    }),
    {
      name: 'mail-web-store',
      partialize: (state) => ({
        lang: state.lang,
        dark: state.dark,
        sidebarCollapsed: state.sidebarCollapsed,
        accountPanelOpen: state.accountPanelOpen,
        sendRecipientRecord: state.sendRecipientRecord,
        selectedEmail: state.selectedEmail,
      }),
    },
  ),
);
