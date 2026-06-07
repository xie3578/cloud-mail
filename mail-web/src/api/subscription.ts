import http from '@/lib/http';

export function subscriptionList() {
  return http.get('/subscription/list');
}

export function subscriptionAdd(data: { senderEmail: string; name?: string }) {
  return http.post('/subscription/add', data);
}

export function subscriptionDelete(subscriptionId: number) {
  return http.delete('/subscription/delete', { params: { subscriptionId } });
}
