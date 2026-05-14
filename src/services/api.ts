import Constants from 'expo-constants';

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
console.log('[API] BASE_URL:', BASE_URL);

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface AuthData {
  userId: number;
  username: string;
  token: string;
}

export interface ReceiptItem {
  id: number;
  productName: string;
  price: number;
  quantity: number;
  unitPrice: number;
  barcode?: string;
  unit?: string;
}

export interface Receipt {
  id: number;
  storeName: string;
  date: string;
  totalAmount: number;
  imagePath?: string;
  categoryId?: number;
  categoryName?: string;
  storeId?: number;
  items: ReceiptItem[];
}

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

export interface Category {
  id: number;
  name: string;
  description?: string;
  iconName?: string;
}

export interface CreateReceiptItem {
  productName: string;
  price: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateReceiptPayload {
  storeName: string;
  date: string;
  totalAmount: number;
  categoryId?: number;
  items: CreateReceiptItem[];
}

const TIMEOUT_MS = 10000;

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

async function fetchWithAuth<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetchWithTimeout(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  return response.json();
}

export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse<AuthData>> => {
    const response = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  register: async (username: string, password: string): Promise<ApiResponse<AuthData>> => {
    const response = await fetchWithTimeout(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },
};

export const receiptsApi = {
  getAll: (token: string) =>
    fetchWithAuth<Receipt[]>('/receipts', token),

  getStats: (token: string) =>
    fetchWithAuth<DashboardStats>('/receipts/stats', token),

  getDailySpending: (token: string, year: number, month: number) =>
    fetchWithAuth<DailySpending[]>(`/receipts/daily-spending?year=${year}&month=${month}`, token),

  getStoreStats: (token: string) =>
    fetchWithAuth<StoreSpending[]>('/receipts/store-stats', token),

  search: (token: string, query: string) =>
    fetchWithAuth<Receipt[]>(`/receipts/search?query=${encodeURIComponent(query)}`, token),

  deleteReceipt: (token: string, id: number) =>
    fetchWithAuth<null>(`/receipts/${id}`, token, { method: 'DELETE' }),

  create: (token: string, payload: CreateReceiptPayload) =>
    fetchWithAuth<Receipt>('/receipts', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const categoriesApi = {
  getAll: (token: string) =>
    fetchWithAuth<Category[]>('/categories', token),
};
