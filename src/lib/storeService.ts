import { localAuth } from './localAuth';

const API_BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = localAuth.getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erro na requisição');
  }
  return res.json();
}

export const storeService = {
  async list<T>(collectionName: string): Promise<T[]> {
    return apiFetch<T[]>(`/${collectionName}`);
  },

  async get<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      return await apiFetch<T>(`/${collectionName}/${id}`);
    } catch {
      return null;
    }
  },

  async create<T>(collectionName: string, data: any): Promise<string> {
    const item = await apiFetch<T & { id: string }>(`/${collectionName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return (item as any).id;
  },

  async update(collectionName: string, id: string, data: any): Promise<void> {
    await apiFetch(`/${collectionName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(collectionName: string, id: string): Promise<void> {
    await apiFetch(`/${collectionName}/${id}`, { method: 'DELETE' });
  },

  /**
   * Polling-based subscribe — simula o comportamento do onSnapshot do Firestore.
   * Faz fetch imediato e depois a cada 5s enquanto o componente estiver montado.
   */
  subscribe<T>(collectionName: string, callback: (data: T[]) => void): () => void {
    let active = true;

    const fetchData = async () => {
      try {
        const data = await apiFetch<T[]>(`/${collectionName}`);
        if (active) callback(data);
      } catch (err) {
        console.error(`[storeService] Erro ao buscar ${collectionName}:`, err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  },
};
