import http from '@/lib/http';

export function folderList() {
  return http.get('/folder/list');
}

export function folderAdd(data: { name: string; color?: string }) {
  return http.post('/folder/add', data);
}

export function folderUpdate(data: { folderId: number; name?: string; color?: string }) {
  return http.put('/folder/update', data);
}

export function folderDelete(params: { folderId: number; deleteEmails?: 0 | 1; targetFolderId?: number }) {
  return http.delete('/folder/delete', { params });
}

export function folderBatchDelete(params: { folderIds: string; deleteEmails?: 0 | 1; targetFolderId?: number }) {
  return http.delete('/folder/batchDelete', { params });
}

export function folderStats() {
  return http.get('/folder/stats');
}
