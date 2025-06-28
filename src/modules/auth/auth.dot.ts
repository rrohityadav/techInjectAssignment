import type { Role } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  role: Role;           // 'ADMIN' | 'SELLER'
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}
