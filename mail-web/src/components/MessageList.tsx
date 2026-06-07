import { Avatar, Button, Spinner, Tooltip as HeroTooltip } from '@heroui/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCheck,
  Copy,
  Menu,
  Pin,
  PinOff,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { allEmailDelete, allEmailLatest, allEmailList } from '@/api/all-email';
import {
  emailDelete,
  emailLatest,
  emailList,
  emailListFolder,
  emailListImportant,
  emailListSpam,
  emailRead,
  emailSetImportant,
  emailSetPin,
  emailSetSpam,
} from '@/api/email';
import { starAdd, starCancel, starList } from '@/api/star';
import { colorFor, EmailUnreadEnum, fromNow, htmlToText, initials } from '@/lib/utils';
import { notifySuccess } from '@/lib/notify';
import { hasPerm } from '@/lib/permissions';
import { useAppStore } from '@/store/app-store';
import type { Email, EmailListResult, MailboxKind } from '@/types';
import ConfirmButton from '@/components/ConfirmButton';

const Tooltip = HeroTooltip as any;

type Props = {
  kind: MailboxKind;
  folderId?: number;
  onOpenDetail?: () => void;
};

function normalizeEmail(email: Email): Email {
  return {
    ...email,
    formatText: email.formatText || htmlToText(email.content, email.text),
    formatCreateTime: fromNow(email.createTime),
    attList: email.attList || [],
  };
}

function sortWithPinned(list: Email[]): Email[] {
  const top = list.filter((e) => e.pinned === 1);
  const bottom = list.filter((e) => e.pinned === -1);
  const middle = list.filter((e) => !e.pinned);
  return [...top, ...middle, ...bottom];
}

export default function MessageList({ kind, folderId, onOpenDetail }: Props) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const currentAccountId = useAppStore((state) => state.currentAccountId);
  const selectedEmail = useAppStore((state) => state.selectedEmail.email);
  const deleteIds = useAppStore((state) => state.deleteIds);
  const starChangedId = useAppStore((state) => state.starChangedId);
  const starChangedValue = useAppStore((state) => state.starChangedValue);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const selectEmail = useAppStore((state) => state.selectEmail);
  const setDeleteIds = useAppStore((state) => state.setDeleteIds);
  const setStarChanged = useAppStore((state) => state.setStarChanged);
  const settings = useAppStore((state) => state.settings);

  const [items, setItems] = useState<Email[]>([]);
  const [total, setTotal] = useState(0);
  const [latest, setLatest] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [timeSort, setTimeSort] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [allMailType, setAllMailType] = useState('');

  const virtualizer = useVirtualizer({
    count: items.length + (following || noMore ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    overscan: 12,
  });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const fetchPage = useCallback(
    async (cursor = 0): Promise<EmailListResult> => {
      if (kind === 'starred') return (await starList(cursor, 50)) as EmailListResult;
      if (kind === 'all-mail') {
        return (await allEmailList({
          emailId: cursor, size: 50, timeSort,
          type: allMailType, subject: searchText,
          accountEmail: searchText, userEmail: searchText, name: searchText,
        })) as EmailListResult;
      }
      if (kind === 'spam') return (await emailListSpam(cursor, 50, timeSort)) as EmailListResult;
      if (kind === 'important') return (await emailListImportant(cursor, 50, timeSort)) as EmailListResult;
      if (kind === 'folder') return (await emailListFolder(folderId || 0, cursor, 50, timeSort)) as EmailListResult;
      return (await emailList(
        currentAccountId, 0, cursor, timeSort, 50,
        kind === 'sent' ? 1 : 0,
        kind === 'inbox', // excludeSpam
      )) as EmailListResult;
    },
    [allMailType, currentAccountId, folderId, kind, searchText, timeSort],
  );

  const refresh = useCallback(async () => {
    if (kind !== 'starred' && kind !== 'all-mail' && kind !== 'spam' && kind !== 'important' && kind !== 'folder' && !currentAccountId) return;
    setLoading(true);
    setNoMore(false);
    setSelectedIds([]);
    try {
      const data = await fetchPage(0);
      const list = sortWithPinned((data.list || []).map(normalizeEmail));
      setItems(list);
      setTotal(data.total || list.length);
      setLatest(data.latestEmail || list[0] || null);
      setNoMore(list.length < 50);
    } finally {
      setLoading(false);
    }
  }, [currentAccountId, fetchPage, kind]);

  async function loadMore() {
    if (loading || following || noMore || !items.length) return;
    setFollowing(true);
    try {
      const unpinned = items.filter((e) => !e.pinned);
      const cursor = unpinned.at(-1)?.emailId || items.at(-1)?.emailId || 0;
      const data = await fetchPage(cursor);
      const list = (data.list || []).map(normalizeEmail);
      setItems((current) => {
        const merged = [...current, ...list.filter((item) => !current.some((cur) => cur.emailId === item.emailId))];
        return sortWithPinned(merged);
      });
      setNoMore(list.length < 50);
    } finally {
      setFollowing(false);
    }
  }

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!deleteIds.length) return;
    setItems((current) => current.filter((item) => !deleteIds.includes(item.emailId)));
    if (deleteIds.includes(selectedEmail?.emailId || 0)) {
      selectEmail({ email: null, delType: null, showReply: true, showStar: true, showUnread: false });
    }
  }, [deleteIds]);

  useEffect(() => {
    if (!starChangedId) return;
    setItems((current) =>
      current
        .map((item) => (item.emailId === starChangedId ? { ...item, isStar: starChangedValue } : item))
        .filter((item) => (kind === 'starred' ? item.isStar : true)),
    );
  }, [kind, starChangedId, starChangedValue]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const autoRefresh = Number(settings.autoRefresh || 0);
      if (autoRefresh <= 1 || kind === 'starred' || kind === 'sent') return;
      const latestId = latest?.emailId || 0;
      const list =
        kind === 'all-mail'
          ? ((await allEmailLatest(latestId).catch(() => [])) as Email[])
          : ((await emailLatest(latestId, currentAccountId, 0).catch(() => [])) as Email[]);
      if (list.length) {
        setItems((current) => {
          const next = [...current];
          list.map(normalizeEmail).forEach((item) => {
            if (!next.some((cur) => cur.emailId === item.emailId)) next.unshift(item);
          });
          return sortWithPinned(next);
        });
        setLatest(list[0]);
      }
    }, Math.max(Number(settings.autoRefresh || 3), 3) * 1000);
    return () => window.clearInterval(interval);
  }, [currentAccountId, kind, latest?.emailId, settings.autoRefresh]);

  useEffect(() => {
    const [last] = [...virtualizer.getVirtualItems()].reverse();
    if (last && last.index >= items.length - 8) loadMore();
  }, [virtualizer.getVirtualItems(), items.length]);

  function open(email: Email) {
    const context = {
      email,
      delType: kind === 'all-mail' ? ('physics' as const) : ('logic' as const),
      showStar: kind !== 'all-mail',
      showReply: kind !== 'all-mail',
      showUnread: kind === 'inbox',
    };
    selectEmail(context);
    if (kind === 'inbox' && email.unread === EmailUnreadEnum.UNREAD) {
      email.unread = EmailUnreadEnum.READ;
      emailRead([email.emailId]).catch(() => null);
    }
    onOpenDetail?.();
  }

  async function toggleStar(email: Email) {
    const next = email.isStar ? 0 : 1;
    setItems((current) =>
      current
        .map((item) => (item.emailId === email.emailId ? { ...item, isStar: next } : item))
        .filter((item) => (kind === 'starred' ? item.isStar : true)),
    );
    setStarChanged(email.emailId, next as 0 | 1);
    if (next) await starAdd(email.emailId);
    else await starCancel(email.emailId);
  }

  async function removeSelected() {
    if (!selectedIds.length) return;
    if (kind === 'all-mail') await allEmailDelete(selectedIds);
    else await emailDelete(selectedIds);
    setDeleteIds(selectedIds);
    setSelectedIds([]);
    notifySuccess(t('delSuccessMsg'));
  }

  async function readSelected() {
    if (!selectedIds.length) return;
    await emailRead(selectedIds);
    setItems((current) =>
      current.map((item) => selectedIds.includes(item.emailId) ? { ...item, unread: EmailUnreadEnum.READ } : item),
    );
    setSelectedIds([]);
  }

  async function markSpamSelected(isSpam: 0 | 1) {
    if (!selectedIds.length) return;
    await emailSetSpam(selectedIds, isSpam);
    setItems((current) =>
      kind === 'spam'
        ? current.filter((item) => !selectedIds.includes(item.emailId))
        : current.map((item) => selectedIds.includes(item.emailId) ? { ...item, isSpam } : item),
    );
    setSelectedIds([]);
    notifySuccess(isSpam ? t('markedSpam') : t('markedNotSpam'));
  }

  async function markImportantSelected(isImportant: 0 | 1) {
    if (!selectedIds.length) return;
    await emailSetImportant(selectedIds, isImportant);
    setItems((current) =>
      kind === 'important'
        ? current.filter((item) => !selectedIds.includes(item.emailId))
        : current.map((item) => selectedIds.includes(item.emailId) ? { ...item, isImportant } : item),
    );
    setSelectedIds([]);
    notifySuccess(isImportant ? t('markedImportant') : t('markedNotImportant'));
  }

  async function togglePin(email: Email) {
    const pinned: -1 | 0 | 1 = email.pinned === 1 ? 0 : 1;
    await emailSetPin(email.emailId, pinned);
    setItems((current) => sortWithPinned(current.map((item) => item.emailId === email.emailId ? { ...item, pinned } : item)));
    notifySuccess(pinned === 1 ? t('pinnedTop') : t('unpinned'));
  }

  async function pinBottomItem(email: Email) {
    const pinned: -1 | 0 | 1 = email.pinned === -1 ? 0 : -1;
    await emailSetPin(email.emailId, pinned);
    setItems((current) => sortWithPinned(current.map((item) => item.emailId === email.emailId ? { ...item, pinned } : item)));
    notifySuccess(pinned === -1 ? t('pinnedBottom') : t('unpinned'));
  }

  async function copyCode(code?: string) {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    notifySuccess(t('copySuccessMsg'));
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <section className="flex h-full flex-col">
      <div className="flex items-center gap-3 p-4">
        <button
          aria-label="Open sidebar"
          className="icon-button sidebar-open-button"
          onClick={() => setSidebarOpen(true)}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex h-14 flex-1 items-center gap-3 rounded-2xl bg-surface px-4 shadow-sm">
          <Search className="size-5 text-muted" />
          <input
            className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') refresh(); }}
            placeholder={`${t('search')}...`}
            value={searchText}
          />
        </div>
      </div>

      {kind === 'all-mail' ? (
        <div className="flex gap-2 px-4 pb-2">
          {['', 'receive', 'send', 'delete', 'noone'].map((type) => (
            <Button
              key={type || 'all'}
              size="sm"
              variant={allMailType === type ? 'primary' : 'outline'}
              onPress={() => { setAllMailType(type); setTimeout(refresh); }}
            >
              {type || t('all')}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="flex h-12 items-center justify-between border-y border-separator px-4">
        <div className="flex items-center gap-2">
          <input
            checked={items.length > 0 && selectedIds.length === items.length}
            onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.emailId) : [])}
            type="checkbox"
          />
          <button className="icon-button" onClick={() => setTimeSort((sort) => (sort ? 0 : 1))} type="button">
            {timeSort ? <ArrowUpAZ className="size-5" /> : <ArrowDownAZ className="size-5" />}
          </button>
          <button className="icon-button" onClick={refresh} type="button">
            <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {selectedIds.length ? (
            <>
              {hasPerm('email:delete') ? (
                <ConfirmButton
                  className="icon-button"
                  description={t('deleteSelectedEmailsConfirmDescription', { total: selectedIds.length })}
                  isDisabled={!selectedIds.length}
                  isIconOnly
                  onConfirm={removeSelected}
                  title={t('deleteSelectedEmailsConfirmTitle')}
                  variant="outline"
                >
                  <Trash2 className="size-5" />
                </ConfirmButton>
              ) : null}
              {kind === 'inbox' ? (
                <button className="icon-button" onClick={readSelected} title={t('markAsRead')} type="button">
                  <CheckCheck className="size-5" />
                </button>
              ) : null}
              {kind !== 'all-mail' && kind !== 'starred' ? (
                <>
                  <Tooltip content={kind === 'spam' ? t('markNotSpam') : t('markSpam')}>
                    <button
                      className="icon-button"
                      onClick={() => markSpamSelected(kind === 'spam' ? 0 : 1)}
                      type="button"
                    >
                      {kind === 'spam' ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
                    </button>
                  </Tooltip>
                  <Tooltip content={kind === 'important' ? t('markNotImportant') : t('markImportant')}>
                    <button
                      className="icon-button"
                      onClick={() => markImportantSelected(kind === 'important' ? 0 : 1)}
                      type="button"
                    >
                      <AlertCircle className={`size-5 ${kind === 'important' ? 'text-amber-500' : ''}`} />
                    </button>
                  </Tooltip>
                </>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="text-sm text-muted">{total ? t('emailCount', { total }) : ''}</div>
      </div>

      <div className="relative flex-1 overflow-auto px-4 py-3" ref={parentRef}>
        {loading ? (
          <div className="flex h-full items-center justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted">{t('noMessagesFound')}</div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualItems.map((virtual) => {
              const email = items[virtual.index];
              if (!email) {
                return (
                  <div
                    className="flex items-center justify-center text-sm text-muted"
                    key={`loader-${virtual.index}`}
                    style={{ height: virtual.size, position: 'absolute', transform: `translateY(${virtual.start}px)`, width: '100%' }}
                  >
                    {following ? <Spinner size="sm" /> : t('noMoreData')}
                  </div>
                );
              }

              const unread = kind === 'inbox' && email.unread === EmailUnreadEnum.UNREAD;
              const isPinnedTop = email.pinned === 1;
              const isPinnedBottom = email.pinned === -1;

              return (
                <div
                  className="pb-2"
                  key={email.emailId}
                  style={{ minHeight: virtual.size, position: 'absolute', transform: `translateY(${virtual.start}px)`, width: '100%' }}
                >
                  <button
                    className="mail-row w-full text-left"
                    data-active={selectedEmail?.emailId === email.emailId}
                    onClick={() => open(email)}
                    type="button"
                  >
                    <Avatar className="mail-avatar size-14" style={{ background: colorFor(email.sendEmail || email.name) }}>
                      <Avatar.Fallback>{initials(email.name || email.sendEmail)}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          checked={selectedSet.has(email.emailId)}
                          onChange={(event) => {
                            event.stopPropagation();
                            setSelectedIds((ids) =>
                              event.target.checked ? [...ids, email.emailId] : ids.filter((id) => id !== email.emailId),
                            );
                          }}
                          onClick={(event) => event.stopPropagation()}
                          type="checkbox"
                        />
                        <div className={`min-w-0 flex-1 truncate text-[17px] ${unread ? 'font-bold' : 'font-semibold'}`}>
                          {isPinnedTop ? <Pin className="mr-1 inline size-3 text-blue-500" /> : null}
                          {isPinnedBottom ? <PinOff className="mr-1 inline size-3 text-muted" /> : null}
                          {email.isImportant ? <AlertCircle className="mr-1 inline size-3 text-amber-500" /> : null}
                          {email.name || email.sendEmail || email.toEmail}
                        </div>
                      </div>
                      <div className={`line-clamp-1 text-[15px] ${unread ? 'font-semibold' : ''}`}>
                        {email.code ? (
                          <button
                            className="mr-1 text-blue-600"
                            onClick={(event) => { event.stopPropagation(); copyCode(email.code); }}
                            type="button"
                          >
                            [{t('codeLabel')}{email.code}]
                          </button>
                        ) : null}
                        {email.subject || '​'}
                      </div>
                      <div className="line-clamp-1 text-[15px] text-muted">{email.formatText || '​'}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`whitespace-nowrap text-sm ${unread ? 'font-bold' : 'text-muted'}`}>
                          {email.formatCreateTime}
                        </span>
                        {unread ? <span aria-hidden="true" className="size-2 rounded-full bg-blue-500" /> : null}
                      </div>
                      <div className="flex items-center gap-1">
                        {email.code ? (
                          <Tooltip content={t('copyCode')}>
                            <button
                              className="icon-button size-8"
                              onClick={(event) => { event.stopPropagation(); copyCode(email.code); }}
                              type="button"
                            >
                              <Copy className="size-4" />
                            </button>
                          </Tooltip>
                        ) : null}
                        {kind !== 'all-mail' ? (
                          <>
                            <Tooltip content={isPinnedTop ? t('unpinTop') : t('pinTop')}>
                              <button
                                className="icon-button size-8"
                                onClick={(event) => { event.stopPropagation(); togglePin(email); }}
                                type="button"
                              >
                                <Pin className={`size-4 ${isPinnedTop ? 'fill-blue-500 text-blue-500' : 'text-muted'}`} />
                              </button>
                            </Tooltip>
                            <button
                              className="icon-button size-8"
                              onClick={(event) => { event.stopPropagation(); toggleStar(email); }}
                              type="button"
                            >
                              <Star className={`size-5 ${email.isStar ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
