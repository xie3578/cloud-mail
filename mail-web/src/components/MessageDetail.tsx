import { Avatar, ScrollShadow, Tooltip as HeroTooltip } from '@heroui/react';
import { AlertCircle, ArrowLeft, Download, Languages, Loader2, Pin, Reply, ShieldAlert, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { allEmailDelete } from '@/api/all-email';
import { emailDelete, emailRead, emailSetImportant, emailSetPin, emailSetSpam, emailTranslate, emailTranslationStatus } from '@/api/email';
import { starAdd, starCancel } from '@/api/star';
import { hasPerm } from '@/lib/permissions';
import {
  colorFor,
  cvtR2Url,
  EmailUnreadEnum,
  formatBytes,
  formatDetailDate,
  formatMailContent,
  formatRecipients,
  getExtName,
  initials,
} from '@/lib/utils';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useAppStore } from '@/store/app-store';
import type { Email, EmailTranslation, EmailTranslationStatus } from '@/types';
import ConfirmButton from '@/components/ConfirmButton';
import ShadowHtml from '@/components/ShadowHtml';

const Tooltip = HeroTooltip as any;

function isImage(name = '') {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'jfif', 'webp'].includes(getExtName(name));
}

export default function MessageDetail({
  email,
  onBack,
}: {
  email: Email | null;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  const selected = useAppStore((state) => state.selectedEmail);
  const lang = useAppStore((state) => state.lang);
  const selectEmail = useAppStore((state) => state.selectEmail);
  const setDeleteIds = useAppStore((state) => state.setDeleteIds);
  const setStarChanged = useAppStore((state) => state.setStarChanged);
  const openComposer = useAppStore((state) => state.openComposer);
  const [preview, setPreview] = useState<string | null>(null);
  const [translationStatus, setTranslationStatus] = useState<EmailTranslationStatus | null>(null);
  const [translation, setTranslation] = useState<EmailTranslation | null>(null);
  const [checkingTranslation, setCheckingTranslation] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const attList = email?.attList || [];
  const recipients = useMemo(() => formatRecipients(email?.recipient), [email?.recipient]);

  useEffect(() => {
    if (email && selected.showUnread && email.unread === EmailUnreadEnum.UNREAD) {
      email.unread = EmailUnreadEnum.READ;
      emailRead([email.emailId]).catch(() => null);
    }
  }, [email?.emailId]);

  useEffect(() => {
    let canceled = false;
    setTranslationStatus(null);
    setTranslation(null);
    setShowTranslation(false);
    setCheckingTranslation(false);

    if (!email?.emailId) return;

    setCheckingTranslation(true);
    emailTranslationStatus(email.emailId, lang)
      .then((status: EmailTranslationStatus) => {
        if (canceled) return;
        setTranslationStatus(status);
        setTranslation(status.translation || null);
      })
      .catch((error: any) => {
        if (!canceled && error?.message) notifyError(error.message);
      })
      .finally(() => {
        if (!canceled) setCheckingTranslation(false);
      });

    return () => {
      canceled = true;
    };
  }, [email?.emailId, lang]);

  if (!email) {
    return (
      <div className="surface-card flex h-full min-h-0 w-full items-center justify-center rounded-[24px] text-muted">
        {t('noMessagesFound')}
      </div>
    );
  }

  async function changeStar() {
    if (!email) return;
    const next = email.isStar ? 0 : 1;
    email.isStar = next;
    selectEmail({ ...selected, email: { ...email } });
    setStarChanged(email.emailId, next as 0 | 1);
    if (next) await starAdd(email.emailId);
    else await starCancel(email.emailId);
  }

  async function remove() {
    if (!email) return;
    if (selected.delType === 'physics') await allEmailDelete(email.emailId);
    else await emailDelete(email.emailId);
    setDeleteIds([email.emailId]);
    selectEmail({ ...selected, email: null });
    notifySuccess(t('delSuccessMsg'));
    onBack?.();
  }

  async function togglePin() {
    if (!email) return;
    const pinned: -1 | 0 | 1 = email.pinned === 1 ? 0 : 1;
    await emailSetPin(email.emailId, pinned);
    email.pinned = pinned;
    selectEmail({ ...selected, email: { ...email } });
    notifySuccess(pinned === 1 ? t('pinnedTop') : t('unpinned'));
  }

  async function toggleSpam() {
    if (!email) return;
    const isSpam = email.isSpam ? 0 : 1;
    await emailSetSpam([email.emailId], isSpam as 0 | 1);
    email.isSpam = isSpam;
    selectEmail({ ...selected, email: { ...email } });
    notifySuccess(isSpam ? t('markedSpam') : t('markedNotSpam'));
  }

  async function toggleImportant() {
    if (!email) return;
    const isImportant = email.isImportant ? 0 : 1;
    await emailSetImportant([email.emailId], isImportant as 0 | 1);
    email.isImportant = isImportant;
    selectEmail({ ...selected, email: { ...email } });
    notifySuccess(isImportant ? t('markedImportant') : t('markedNotImportant'));
  }

  async function toggleTranslation() {
    if (!email || translating) return;
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translation) {
      setShowTranslation(true);
      return;
    }

    setTranslating(true);
    try {
      const data = (await emailTranslate(email.emailId, lang)) as EmailTranslation;
      setTranslation(data);
      setTranslationStatus((current) => current ? { ...current, translation: data } : current);
      setShowTranslation(true);
    } catch (error: any) {
      notifyError(error?.message || t('translationFailed'));
    } finally {
      setTranslating(false);
    }
  }

  const showTranslateButton = !checkingTranslation && !!translationStatus?.needsTranslation;
  const translationTooltip = translating
    ? t('translating')
    : showTranslation
      ? t('showOriginal')
      : translation
        ? t('showTranslation')
        : t('translate');
  const displayedTranslation = showTranslation && translation ? translation : null;
  const displaySubject = displayedTranslation ? displayedTranslation.subject || t('subject') : email.subject || t('subject');
  const displayContent = displayedTranslation ? displayedTranslation.content || '' : email.content || '';
  const displayText = displayedTranslation ? displayedTranslation.text || '' : email.text || '';

  return (
    <article className="surface-card flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[24px]">
      <header className="flex min-h-16 shrink-0 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button className="icon-button message-detail-back-button" onClick={onBack} type="button">
              <ArrowLeft className="size-5" />
            </button>
          ) : null}
          {hasPerm('email:delete') ? (
            <Tooltip content={t('delete')}>
              <ConfirmButton
                className="icon-button"
                description={t('deleteEmailConfirmDescription')}
                isIconOnly
                onConfirm={remove}
                title={t('deleteEmailConfirmTitle')}
                variant="outline"
              >
                <Trash2 className="size-5" />
              </ConfirmButton>
            </Tooltip>
          ) : null}
          {selected.showStar ? (
            <Tooltip content={email.isStar ? t('unstar') : t('star')}>
              <button className="icon-button" onClick={changeStar} type="button">
                <Star className={`size-5 ${email.isStar ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </Tooltip>
          ) : null}
          {selected.showStar ? (
            <>
              <Tooltip content={email.pinned === 1 ? t('unpinTop') : t('pinTop')}>
                <button className="icon-button" onClick={togglePin} type="button">
                  <Pin className={`size-5 ${email.pinned === 1 ? 'fill-blue-500 text-blue-500' : ''}`} />
                </button>
              </Tooltip>
              <Tooltip content={email.isImportant ? t('markNotImportant') : t('markImportant')}>
                <button className="icon-button" onClick={toggleImportant} type="button">
                  <AlertCircle className={`size-5 ${email.isImportant ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </Tooltip>
              <Tooltip content={email.isSpam ? t('markNotSpam') : t('markSpam')}>
                <button className="icon-button" onClick={toggleSpam} type="button">
                  {email.isSpam ? <ShieldCheck className="size-5 text-green-500" /> : <ShieldAlert className="size-5" />}
                </button>
              </Tooltip>
            </>
          ) : null}
          {showTranslateButton ? (
            <Tooltip content={translationTooltip}>
              <button className="icon-button" disabled={translating} onClick={toggleTranslation} type="button">
                {translating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Languages className={`size-5 ${showTranslation ? 'text-blue-600' : ''}`} />
                )}
              </button>
            </Tooltip>
          ) : null}
        </div>
        <div className="text-sm text-muted">1 of 1</div>
      </header>

      <ScrollShadow className="min-h-0 flex-1 overflow-x-hidden px-7 py-7" offset={12} size={48}>
        <h1 className="mb-9 text-[28px] font-semibold leading-tight">{displaySubject}</h1>
        <div className="mb-9 flex items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar className="mail-avatar size-14 shrink-0" style={{ background: colorFor(email.sendEmail || email.name) }}>
              <Avatar.Fallback>{initials(email.name || email.sendEmail)}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{email.name || email.sendEmail}</div>
              <div className="truncate text-muted">{email.sendEmail}</div>
              <div className="truncate text-muted">{recipients ? `${t('recipient')}: ${recipients}` : ''}</div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm text-muted">{formatDetailDate(email.createTime)}</div>
            <div className="mt-4 flex justify-end gap-2">
              {selected.showReply && hasPerm('email:send') ? (
                <>
                  <button className="icon-button" onClick={() => openComposer({ mode: 'reply', email })} type="button">
                    <Reply className="size-5" />
                  </button>
                  <button className="icon-button" onClick={() => openComposer({ mode: 'forward', email })} type="button">
                    <Reply className="size-5 rotate-180" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="max-w-[980px] text-[17px] leading-8">
          {displayContent ? (
            <ShadowHtml html={formatMailContent(displayContent)} />
          ) : (
            <pre className="whitespace-pre-wrap font-inherit">{displayText}</pre>
          )}
        </div>

        {attList.length ? (
          <div className="mt-10 max-w-2xl rounded-2xl border border-separator p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">{t('attachments')}</span>
              <span className="text-sm text-muted">{t('attCount', { total: attList.length })}</span>
            </div>
            <div className="space-y-2">
              {attList.map((att) => (
                <div className="flex items-center gap-3 rounded-xl bg-surface-secondary px-3 py-2" key={att.attId || att.key}>
                  <button
                    className="min-w-0 flex-1 truncate text-left"
                    onClick={() => (isImage(att.filename) ? setPreview(cvtR2Url(att.key)) : null)}
                    type="button"
                  >
                    <span className="font-medium">{att.filename}</span>
                    <span className="ml-3 text-sm text-muted">{formatBytes(att.size)}</span>
                  </button>
                  <a className="icon-button" download href={cvtR2Url(att.key)}>
                    <Download className="size-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ScrollShadow>

      {preview ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6" onClick={() => setPreview(null)}>
          <img alt="attachment preview" className="max-h-full max-w-full rounded-xl object-contain" src={preview} />
        </div>
      ) : null}
    </article>
  );
}
