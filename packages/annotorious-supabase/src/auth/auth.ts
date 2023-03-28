import type { SupabaseClient, User } from '@supabase/supabase-js';

export const createAuth = (supabase: SupabaseClient) => {

  const getUser = () => supabase.auth.getUser().then(({ data, error }) => {
    if (error)
      throw error;

    return data.user;
  });

  const signIn = (email: string) => supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href
    }
  }).then(({ data, error }) => {
    if (error)
      throw error;

    return data;
  });

  const checkStatusAndSignIn = (email: string): Promise<User | null> => {

    const signIn = () => supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href
      }
    }).then(({ error }) => {
      if (error)
        console.error(error);
      else
        console.log('Magic link sent');

      return null;
    });

    return supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.log('User not signed in.');
        return signIn();
      } else {
        const { user } = data;

        if (user.email === email) {
          console.log('User logged in');
          return data.user;
        } else {
          console.log('User changed');
          return signIn();
        }
      }
    });
  }
  
  return { getUser, signIn, checkStatusAndSignIn }

}