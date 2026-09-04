/*
 * Wire shapes match the backend contract exactly (snake_case) — never rename
 * these fields, they're what actually crosses the network.
 */
export interface UserWire {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthResponseWire {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserWire;
}

export interface RefreshResponseWire {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserWire;
}

export interface ApiErrorWire {
  statusCode: number;
  message: string;
  error: string;
}

export interface RegisterRequestWire {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginRequestWire {
  email: string;
  password: string;
}

export interface RefreshRequestWire {
  refresh_token: string;
}
