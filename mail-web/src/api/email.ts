import http from '@/lib/http';
import type { Lang } from '@/types';

export function emailList(
  accountId: number,
  allReceive: number | undefined,
  emailId = 0,
  timeSort = 0,
  size = 50,
  type = 0,
  excludeSpam = false,
) {
  return http.get('/email/list', {
    params: { accountId, allReceive, emailId, timeSort, size, type, ...(excludeSpam ? { isSpam: 0 } : {}) },
  });
}

export function emailDelete(emailIds: number[] | number) {
  return http.delete(`/email/delete?emailIds=${emailIds}`);
}

export function emailLatest(emailId: number, accountId: number, allReceive?: number) {
  return http.get('/email/latest', {
    params: { emailId, accountId, allReceive },
    noMsg: true,
    timeout: 35 * 1000,
  } as any);
}

export function emailRead(emailIds: number[] | number) {
  return http.put('/email/read', { emailIds });
}

export function emailTranslationStatus(emailId: number, targetLang: Lang) {
  return http.get('/email/translation/status', {
    params: { emailId, targetLang },
    noMsg: true,
    timeout: 35 * 1000,
  } as any);
}

export function emailTranslate(emailId: number, targetLang: Lang) {
  return http.post('/email/translate', { emailId, targetLang }, {
    noMsg: true,
    timeout: 180 * 1000,
  } as any);
}

export function emailSend(form: any, progress?: (e: ProgressEvent) => void) {
  return http.post('/email/send', form, {
    onUploadProgress: (e) => progress?.(e as unknown as ProgressEvent),
    noMsg: true,
  } as any);
}

export function emailSetSpam(emailIds: number[], isSpam: 0 | 1) {
  return http.put('/email/spam', { emailIds, isSpam });
}

export function emailSetImportant(emailIds: number[], isImportant: 0 | 1) {
  return http.put('/email/important', { emailIds, isImportant });
}

export function emailSetPin(emailId: number, pinned: -1 | 0 | 1) {
  return http.put('/email/pin', { emailId, pinned });
}

export function emailSetFolder(emailIds: number[], folderId: number) {
  return http.put('/email/folder', { emailIds, folderId });
}

export function emailListSpam(emailId = 0, size = 50, timeSort = 0) {
  return http.get('/email/list', { params: { emailId, size, timeSort, isSpam: 1 } });
}

export function emailListImportant(emailId = 0, size = 50, timeSort = 0) {
  return http.get('/email/list', { params: { emailId, size, timeSort, isImportant: 1 } });
}

export function emailListFolder(folderId: number, emailId = 0, size = 50, timeSort = 0) {
  return http.get('/email/list', { params: { emailId, size, timeSort, folderId } });
}
