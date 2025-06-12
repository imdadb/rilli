import bcrypt from 'bcryptjs';

/**
 * Hash a plain text password using bcrypt with 10 salt rounds
 */
export async function hashPassword(rawPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(rawPassword, salt);
}

/**
 * Compare a plain text password with a bcrypt hash
 */
export async function checkPassword(
  rawPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(rawPassword, hashedPassword);
}
