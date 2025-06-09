import { supabase } from './supabaseClient';
import { hashPassword, checkPassword } from './password';

export interface User {
  email: string;
  password: string | null;
  email_verified: boolean;
}

export async function fetchUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('email, password, email_verified')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
  
  return data;
}

export async function validatePassword(email: string, rawPassword: string): Promise<boolean> {
  const user = await fetchUserByEmail(email);
  if (!user || !user.password) {
    return false;
  }

  // Fallback: if the stored password is still plain "administan", allow it once
  // then upgrade the record to hashed so we phase out plain text
  if (user.password === 'administan') {
    if (rawPassword !== 'administan') {
      return false;
    }
    
    // Upgrade to hashed password
    const hashedPassword = await hashPassword(rawPassword);
    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);
    
    console.log(`Upgraded plain text password to hashed for user: ${email}`);
    return true;
  }

  // Use bcrypt to compare the password
  return checkPassword(rawPassword, user.password);
}

export async function createVerificationToken(email: string): Promise<string> {
  // Generate a 6-character random token
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  
  // Set expiration to 30 minutes from now
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  
  const { error } = await supabase
    .from('verification_tokens')
    .insert({
      email,
      token,
      expires_at: expiresAt.toISOString()
    });
  
  if (error) {
    console.error('Error creating verification token:', error);
    throw error;
  }
  
  return token;
}

export async function validateVerificationToken(email: string, token: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('verification_tokens')
    .select('*')
    .eq('email', email)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  
  if (error) {
    console.error('Error validating verification token:', error);
    throw error;
  }
  
  return !!data;
}

export async function setUserPassword(email: string, rawPassword: string): Promise<void> {
  // Hash the password before storing
  const hashedPassword = await hashPassword(rawPassword);
  
  const { error } = await supabase
    .from('users')
    .update({
      password: hashedPassword,
      email_verified: true
    })
    .eq('email', email);
  
  if (error) {
    console.error('Error setting user password:', error);
    throw error;
  }
}

export async function deleteVerificationToken(email: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('verification_tokens')
    .delete()
    .eq('email', email)
    .eq('token', token);
  
  if (error) {
    console.error('Error deleting verification token:', error);
    throw error;
  }
}