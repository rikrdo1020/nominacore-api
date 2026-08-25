import { randomInt } from 'crypto';

export const BCRYPT_COST = 12;

// Excludes visually ambiguous characters (0/O, 1/l/I).
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const TEMP_PASSWORD_LENGTH = 12;

export function generateTempPassword(): string {
  let password = '';
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    password += TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return password;
}
