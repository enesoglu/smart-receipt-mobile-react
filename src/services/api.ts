import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { formatIsoDate } from '../utils/format';

function getBaseUrl(): string {
  const debuggerHost =
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ??
    (Constants.manifest as any)?.debuggerHost;

  if (debuggerHost) {
    const host = String(debuggerHost).split(':')[0];
    if (host) return `http://${host}:5069/api`;
  }

  return 'http://10.0.2.2:5069/api';
}

const BASE_URL = getBaseUrl();
export const MEDIA_BASE_URL = BASE_URL.replace(/\/api$/, '');

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface AuthData {
  userId: number;
  fullName: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  iconUrl?: string | null;
  monthlyBudgetLimit?: number | null;
  isSystemDefault: boolean;
}

export interface UpsertCategoryBody {
  name: string;
  iconUrl?: string | null;
  monthlyBudgetLimit?: number | null;
}

export interface BudgetStatus {
  categoryId: number;
  categoryName: string;
  iconUrl?: string | null;
  monthlyBudgetLimit: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  isOverBudget: boolean;
  hasBudget: boolean;
}

export interface BudgetSummary {
  year: number;
  month: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCategoryCount: number;
  categories: BudgetStatus[];
}

export interface ReceiptItem {
  id?: number;
  itemName: string;
  price: number;
  quantity: number;
  unitPrice: number;
  barcode?: string | null;
  unit?: string | null;
}

export interface Receipt {
  id: number;
  storeName: string;
  date: string;
  totalAmount: number;
  photoUrl?: string | null;
  createdAt?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  storeId?: number | null;
  items: ReceiptItem[];
}

export interface CreateReceiptBody {
  storeName: string;
  date: string;
  totalAmount: number;
  photoUrl?: string | null;
  categoryId?: number | null;
  storeId?: number | null;
  items: ReceiptItem[];
}

export type UpdateReceiptBody = CreateReceiptBody;

export interface DashboardStats {
  totalMonthlySpending: number;
  averageReceiptValue: number;
  mostFrequentStore: string;
  mostFrequentStoreVisitCount: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

export interface StoreSpending {
  storeName: string;
  totalSpending: number;
  receiptCount: number;
}

export interface CategorySpending {
  categoryId: number;
  categoryName: string;
  totalSpending: number;
  receiptCount: number;
}

export interface Dashboard {
  totalMonthlySpending: number;
  monthlyData: { month: number; year: number; totalSpending: number }[];
  storeData: StoreSpending[];
  categoryData: CategorySpending[];
}

export interface ScanResult {
  rawText: string;
  storeName?: string | null;
  date?: string | null;
  totalAmount?: number | null;
  items: ReceiptItem[];
}

export interface ItemAggregate {
  itemName: string;
  totalSpent: number;
  occurrenceCount: number;
  averageUnitPrice: number;
}

export interface Insight {
  message: string;
}

const TIMEOUT_MS = 20000;

function withTimeout(options: RequestInit = {}): RequestInit {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), TIMEOUT_MS);
  return { ...options, signal: controller.signal };
}

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, withTimeout(options));
  const payload = await response.json().catch(() => undefined) as ApiResponse<T> | undefined;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return payload ?? { success: false, message: 'Empty response.' };
}

async function fetchBinary(path: string, token: string): Promise<ArrayBuffer> {
  const response = await fetch(`${BASE_URL}${path}`, withTimeout({
    headers: { Authorization: `Bearer ${token}` },
  }));

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  return response.arrayBuffer();
}

function authHeaders(token: string, json = true): HeadersInit {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

function queryMonth(year?: number, month?: number): string {
  const params = new URLSearchParams();
  if (year) params.append('year', String(year));
  if (month) params.append('month', String(month));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function formDataForFile(fileUri: string, fieldName = 'file'): FormData {
  const extension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
  const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const formData = new FormData();
  formData.append(fieldName, {
    uri: fileUri,
    name: `receipt.${extension}`,
    type,
  } as any);
  return formData;
}

function dateRangeQuery(start?: string | Date, end?: string | Date): string {
  const params = new URLSearchParams();
  if (start) params.append('start', typeof start === 'string' ? start : formatIsoDate(start));
  if (end) params.append('end', typeof end === 'string' ? end : formatIsoDate(end));
  const query = params.toString();
  return query ? `?${query}` : '';
}

function dateFilterQuery(start: string | Date, end: string | Date): string {
  const startDate = typeof start === 'string' ? start : formatIsoDate(start);
  const endDate = typeof end === 'string' ? end : formatIsoDate(end);
  return `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    const chunk = bytes.subarray(i, i + 0x8000);
    binary += String.fromCharCode(...chunk);
  }
  return globalThis.btoa(binary);
}

async function writeReport(ext: 'csv' | 'xlsx' | 'pdf', buffer: ArrayBuffer, start?: string | Date, end?: string | Date) {
  const endDate = end ? new Date(end) : new Date();
  const startDate = start ? new Date(start) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  const fileName = `smartreceipt-${formatIsoDate(startDate).replace(/-/g, '')}-${formatIsoDate(endDate).replace(/-/g, '')}.${ext}`;
  const file = new File(Paths.cache, fileName);
  file.write(arrayBufferToBase64(buffer), { encoding: 'base64' });
  return { filePath: file.uri };
}

export const authApi = {
  register: (body: { fullName: string; email: string; password: string }) =>
    fetchJson<AuthData>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    fetchJson<AuthData>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  me: (token: string) =>
    fetchJson<UserProfile>('/auth/me', {
      headers: authHeaders(token),
    }),
};

export const categoriesApi = {
  list: (token: string) =>
    fetchJson<Category[]>('/categories', { headers: authHeaders(token) }),

  create: (token: string, body: UpsertCategoryBody) =>
    fetchJson<Category>('/categories', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  update: (token: string, id: number, body: UpsertCategoryBody) =>
    fetchJson<Category>(`/categories/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  remove: (token: string, id: number) =>
    fetchJson<null>(`/categories/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  setBudget: (token: string, id: number, monthlyBudgetLimit: number | null) =>
    fetchJson<Category>(`/categories/${id}/budget`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ monthlyBudgetLimit }),
    }),
};

export const budgetsApi = {
  status: (token: string, year?: number, month?: number) =>
    fetchJson<BudgetStatus[]>(`/budgets/status${queryMonth(year, month)}`, { headers: authHeaders(token) }),

  alerts: (token: string, year?: number, month?: number) =>
    fetchJson<BudgetStatus[]>(`/budgets/alerts${queryMonth(year, month)}`, { headers: authHeaders(token) }),

  summary: (token: string, year?: number, month?: number) =>
    fetchJson<BudgetSummary>(`/budgets/summary${queryMonth(year, month)}`, { headers: authHeaders(token) }),
};

export const receiptsApi = {
  list: (token: string) =>
    fetchJson<Receipt[]>('/receipts', { headers: authHeaders(token) }),

  get: (token: string, id: number) =>
    fetchJson<Receipt>(`/receipts/${id}`, { headers: authHeaders(token) }),

  create: (token: string, body: CreateReceiptBody) =>
    fetchJson<Receipt>('/receipts', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  update: (token: string, id: number, body: UpdateReceiptBody) =>
    fetchJson<Receipt>(`/receipts/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ ...body, id }),
    }),

  remove: (token: string, id: number) =>
    fetchJson<null>(`/receipts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  search: (token: string, query: string) =>
    fetchJson<Receipt[]>(`/receipts/search?query=${encodeURIComponent(query)}`, { headers: authHeaders(token) }),

  filterByDate: (token: string, start: string | Date, end: string | Date) =>
    fetchJson<Receipt[]>(`/receipts/filter/date${dateFilterQuery(start, end)}`, { headers: authHeaders(token) }),

  stats: (token: string) =>
    fetchJson<DashboardStats>('/receipts/stats', { headers: authHeaders(token) }),

  dashboard: (token: string) =>
    fetchJson<Dashboard>('/receipts/dashboard', { headers: authHeaders(token) }),

  dailySpending: (token: string, year: number, month: number) =>
    fetchJson<DailySpending[]>(`/receipts/daily-spending?year=${year}&month=${month}`, { headers: authHeaders(token) }),

  storeStats: (token: string) =>
    fetchJson<StoreSpending[]>('/receipts/store-stats', { headers: authHeaders(token) }),

  topItems: (token: string, limit = 10, year?: number, month?: number) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    return fetchJson<ItemAggregate[]>(`/receipts/items/top?${params.toString()}`, { headers: authHeaders(token) });
  },

  insights: (token: string) =>
    fetchJson<Insight>('/receipts/items/insights', { headers: authHeaders(token) }),

  scan: (token: string, fileUri: string) =>
    fetchJson<ScanResult>('/receipts/scan', {
      method: 'POST',
      headers: authHeaders(token, false),
      body: formDataForFile(fileUri),
    }),

  uploadPhoto: (token: string, id: number, fileUri: string) =>
    fetchJson<{ photoUrl: string }>(`/receipts/${id}/photo`, {
      method: 'POST',
      headers: authHeaders(token, false),
      body: formDataForFile(fileUri),
    }),
};

export const reportsApi = {
  downloadCsv: async (token: string, start?: string | Date, end?: string | Date) =>
    writeReport('csv', await fetchBinary(`/reports/receipts.csv${dateRangeQuery(start, end)}`, token), start, end),

  downloadXlsx: async (token: string, start?: string | Date, end?: string | Date) =>
    writeReport('xlsx', await fetchBinary(`/reports/receipts.xlsx${dateRangeQuery(start, end)}`, token), start, end),

  downloadPdf: async (token: string, start?: string | Date, end?: string | Date) =>
    writeReport('pdf', await fetchBinary(`/reports/receipts.pdf${dateRangeQuery(start, end)}`, token), start, end),
};
