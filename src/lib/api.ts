import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  DepartmentName,
  DuplicateMatch,
  NotificationItem,
  OverviewStats,
  UserPublic,
} from '../types';

const TOKEN_KEY = 'campuscare_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getPublicOverview(): Promise<OverviewStats> {
    return apiFetch<OverviewStats>('/api/public/overview');
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserPublic }> {
    const res = await apiFetch<{ token: string; user: UserPublic }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async adminLogin(email: string, password: string): Promise<{ token: string; user: UserPublic }> {
    const res = await apiFetch<{ token: string; user: UserPublic }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    studentIdNumber?: string;
    department?: string;
  }): Promise<{ token: string; user: UserPublic }> {
    const res = await apiFetch<{ token: string; user: UserPublic }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  me(): Promise<{ user: UserPublic }> {
    return apiFetch<{ user: UserPublic }>('/api/auth/me');
  },

  logout(): void {
    setStoredToken(null);
  },

  listComplaints(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    department?: string;
    location?: string;
    search?: string;
    urgentOnly?: boolean;
  }): Promise<{ complaints: Complaint[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'All' && value !== false) {
          params.set(key, String(value));
        }
      });
    }
    const qs = params.toString();
    return apiFetch<{ complaints: Complaint[] }>(`/api/complaints${qs ? `?${qs}` : ''}`);
  },

  checkDuplicates(payload: {
    title: string;
    description?: string;
    category?: ComplaintCategory;
    location?: string;
  }): Promise<{ matches: DuplicateMatch[] }> {
    return apiFetch<{ matches: DuplicateMatch[] }>('/api/complaints/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createComplaint(payload: {
    title: string;
    category: ComplaintCategory;
    description: string;
    location: string;
    priority: ComplaintPriority;
    isAnonymous: boolean;
    imageDataUrl?: string;
  }): Promise<{ complaint: Complaint }> {
    return apiFetch<{ complaint: Complaint }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateComplaint(
    id: string,
    payload: {
      status?: ComplaintStatus;
      department?: DepartmentName;
      priority?: ComplaintPriority;
      adminComment?: string;
    }
  ): Promise<{ complaint: Complaint }> {
    return apiFetch<{ complaint: Complaint }>(`/api/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getAnalytics(): Promise<OverviewStats> {
    return apiFetch<OverviewStats>('/api/analytics');
  },

  listNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
  },

  markNotificationRead(id: string): Promise<{ notification: NotificationItem }> {
    return apiFetch<{ notification: NotificationItem }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsRead(): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },
};
