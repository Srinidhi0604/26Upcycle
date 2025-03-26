import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  user_type?: 'seller' | 'collector' | 'both';
};

export const auth = {
  // Get current user
  getCurrentUser: async (): Promise<AuthUser | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('username, full_name, avatar_url, user_type')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      ...profile
    };
  },

  // Sign up
  signUp: async (email: string, password: string, userData: {
    username: string;
    full_name: string;
    user_type: 'seller' | 'collector' | 'both';
  }) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name,
          user_type: userData.user_type
        }
      }
    });

    if (signUpError) throw signUpError;

    // Create profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email,
        ...userData
      });

    if (profileError) throw profileError;

    return authData;
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Password reset request
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<Omit<AuthUser, 'id' | 'email'>>) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
  },

  // Subscribe to auth changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}; 