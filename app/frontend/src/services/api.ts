import axios, { AxiosError } from 'axios';
import type {
  AudioFile,
  TimeMark,
  AuthStatus,
  LoginResponse,
  ScanResult,
} from '../types';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getStatus: async (): Promise<AuthStatus> => {
    const response = await api.get<AuthStatus>('/auth/status');
    return response.data;
  },

  checkLocked: async (): Promise<{ locked: boolean; failedAttempts: number }> => {
    const response = await api.get<{ locked: boolean; failedAttempts: number }>(
      '/auth/locked'
    );
    return response.data;
  },
};

// Files endpoints
export const filesApi = {
  getAll: async (): Promise<AudioFile[]> => {
    const response = await api.get<AudioFile[]>('/files');
    return response.data;
  },

  getById: async (id: number): Promise<AudioFile> => {
    const response = await api.get<AudioFile>(`/files/${id}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/files/${id}`);
  },

  scan: async (): Promise<ScanResult> => {
    const response = await api.post<ScanResult>('/files/scan');
    return response.data;
  },
};

// Marks endpoints
export const marksApi = {
  getByFileId: async (fileId: number): Promise<TimeMark[]> => {
    const response = await api.get<TimeMark[]>(`/marks/${fileId}`);
    return response.data;
  },

  create: async (
    audioFileId: number,
    timeSeconds: number,
    note: string
  ): Promise<TimeMark> => {
    const response = await api.post<TimeMark>('/marks', {
      audio_file_id: audioFileId,
      time_seconds: timeSeconds,
      note,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/marks/${id}`);
  },
};

// Stream URL generator
export const getStreamUrl = (fileId: number): string => {
  return `${API_BASE_URL}/stream/${fileId}`;
};

export default api;
