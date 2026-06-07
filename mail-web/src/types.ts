export type Lang = 'zh' | 'en';

export type ApiResult<T = unknown> = {
  code: number;
  message: string;
  data: T;
};

export type Account = {
  accountId: number;
  email: string;
  name?: string;
  sort?: number;
  allReceive?: number;
  [key: string]: any;
};

export type User = {
  userId?: number;
  email?: string;
  name?: string;
  permKeys?: string[];
  role?: any;
  account?: Account;
  sendCount?: number;
  [key: string]: any;
};

export type Attachment = {
  attId?: number;
  emailId?: number;
  filename: string;
  size: number;
  key: string;
  contentType?: string;
  type?: string;
  content?: string;
  [key: string]: any;
};

export type EmailTranslation = {
  emailId: number;
  targetLang: Lang;
  sourceLang: 'zh' | 'en' | 'other';
  subject?: string;
  content?: string;
  text?: string;
  createTime?: string;
  [key: string]: any;
};

export type EmailTranslationStatus = {
  sourceLang: 'zh' | 'en' | 'other';
  targetLang: Lang;
  needsTranslation: boolean;
  translation?: EmailTranslation | null;
};

export type Email = {
  emailId: number;
  accountId?: number;
  userId?: number;
  name?: string;
  sendEmail?: string;
  toEmail?: string;
  recipient?: string;
  subject?: string;
  sourceLang?: 'zh' | 'en' | 'other' | '';
  text?: string;
  content?: string;
  createTime?: string | number;
  formatCreateTime?: string;
  formatText?: string;
  type?: number;
  status?: number;
  unread?: number;
  isStar?: number;
  isDel?: number;
  pinned?: number;
  isSpam?: number;
  isImportant?: number;
  folderId?: number;
  code?: string;
  message?: string;
  userEmail?: string;
  attList?: Attachment[];
  checked?: boolean;
  [key: string]: any;
};

export type Folder = {
  folderId: number;
  userId?: number;
  name: string;
  color: string;
  sort?: number;
  emailCount?: number;
  createTime?: string;
  [key: string]: any;
};

export type Subscription = {
  subscriptionId: number;
  userId?: number;
  senderEmail: string;
  name: string;
  emailCount?: number;
  createTime?: string;
  [key: string]: any;
};

export type EmailListResult = {
  list: Email[];
  total?: number;
  latestEmail?: Email;
};

export type MailboxKind = 'inbox' | 'sent' | 'starred' | 'drafts' | 'all-mail' | 'spam' | 'important' | 'folder';

export type SelectedEmailContext = {
  email: Email | null;
  delType: 'logic' | 'physics' | null;
  showStar: boolean;
  showReply: boolean;
  showUnread: boolean;
};
