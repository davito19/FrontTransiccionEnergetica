import { UserRole } from './auth.model';

export interface AppUser {
  id?: number;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}
