import { customAlphabet } from 'nanoid';

export type User = SignedIn | Guest;

export enum UserType { 
  SIGNED_IN = 'SIGNED_IN',  
  GUEST = 'GUEST'
}

export interface Guest {

  type: UserType.GUEST;

  id: string;

}

export interface SignedIn {

  type: UserType.SIGNED_IN;

  id: string;

  name?: string;

  email?: string;

  avatar?: string;

}

export const createAnonymousGuest = () => {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', 20);
  return { type: UserType.GUEST, id: nanoid() }
}