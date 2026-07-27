import supabase from '../lib/supabase';

export const authService = {
  // Signs in an existing user with email and password
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },

  // Signs up a new user and registers a profile row in the users table
  register: async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    if (error) throw error;

    // Insert user record inside the database users table
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name,
          email,
        });
      if (profileError) {
        console.error('Error creating profile inside users table:', profileError);
      }
    }
    return data.user;
  },

  // Signs out the active user session
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Dispatches reset password email links
  forgotPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return data;
  },

  // Fetches current active session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Registers callback subscription for changes in session state
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};

export default authService;
