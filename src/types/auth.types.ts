export interface User {
  _id: string;
  email: string;
  role: 'staff' | 'operations' | 'admin' | 'super-admin';
  name: string;
  phone?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
