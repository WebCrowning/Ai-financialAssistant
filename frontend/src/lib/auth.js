// src/lib/auth.js
// Helper functions for Supabase authentication (sign‑up, sign‑in, sign‑out)
// Used by the Login component and can be imported elsewhere.

import { supabase } from '../supabaseClient';

/**
 * Sign up a new user.
 * @param {string} email
 * @param {string} password
 * @param {object} meta Additional user metadata (e.g., monthly_income, role)
 * @returns {Promise<{user: object|null, error: Error|null}>}
 */
export async function signUp(email, password, meta = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta },
  });
  return { user: data?.user ?? null, error };
}

/**
 * Sign in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{session: object|null, user: object|null, error: Error|null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { session: data?.session ?? null, user: data?.user ?? null, error };
}

/** Sign out the current user */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
