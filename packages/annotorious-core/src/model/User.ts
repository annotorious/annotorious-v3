import { customAlphabet } from 'nanoid';

export type User = AuthenticatedUser | Guest;

export enum UserType { 
  AUTHENTICATED = 'AUTHENTICATED',  
  GUEST = 'GUEST'
}

export interface Guest {

  type: UserType.GUEST;

  id: string;

}

export interface AuthenticatedUser {

  type: UserType.AUTHENTICATED;

  id: string;

  name?: string;

  email?: string;

  avatar?: string;

}

export const createAnonymousGuest = () => {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', 20);
  return { type: UserType.GUEST, id: nanoid() }
}