import supabase from '../lib/supabase';

export const authService = {
  // Login
  login: async (email, password) => {
    console.log('Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    console.log('Login success! User object:', data.user);
    console.log('Session metadata:', data.session);

    // Retrieve user profile or create it if missing (self-healing)
    const profile = await authService.ensureUserProfile();

    return {
      user: data.user,
      profile
    };
  },

  // Helper to ensure public.users row exists for active authenticated user
  ensureUserProfile: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication context missing or session expired.');
    }

    console.log('ensureUserProfile running for user ID:', user.id);

    // Query database profile
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Error fetching profile in ensureUserProfile:', selectError);
      throw new Error(`Failed to query database profile: ${selectError.message}`);
    }

    if (!existing) {
      console.log('Profile missing in public.users. Creating profile now...');
      const profilePayload = {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email,
        avatar_url: null
      };

      console.log('Inserting profile payload:', profilePayload);
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert([profilePayload])
        .select();

      if (insertError) {
        console.error('Error inserting profile in ensureUserProfile:', insertError);
        throw new Error(`Profile creation failed: ${insertError.message}. Make sure RLS is configured to permit inserts.`);
      }

      if (!inserted || inserted.length === 0) {
        throw new Error('Profile creation failed: Insert query succeeded but returned no rows.');
      }

      console.log('Successfully created public.users profile:', inserted[0]);
      return inserted[0];
    } else {
      console.log('Profile already exists in public.users for user ID:', user.id);
      return existing;
    }
  },

  // Register
  register: async (name, email, password) => {
    console.log('Attempting sign up for:', email, 'Name:', name);
    // Create authentication account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    console.log('Sign up success! Auth User:', data.user);
    console.log('Sign up Session:', data.session);

    // Insert profile into users table
    if (data?.user) {
      try {
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (selectError) {
          console.warn('Select check failed during registration:', selectError);
        }

        if (!existingUser) {
          console.log('Profile row missing. Inserting profile for new user...');
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                full_name: name,
                email: email,
                avatar_url: null
              },
            ]);

          if (profileError) {
            console.warn('Silent warning: Client profile creation during signup failed (expected if email confirmation is enabled):', profileError.message);
          } else {
            console.log('Successfully inserted user profile row during signup.');
          }
        }
      } catch (err) {
        console.error('Exception check/inserting profile during register:', err);
      }
    }

    return data.user;
  },

  // Logout
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Forgot Password
  forgotPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) throw error;

    return data;
  },

  // Current Session
  getCurrentSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    return session;
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback);

    return subscription;
  },
};

export default authService;