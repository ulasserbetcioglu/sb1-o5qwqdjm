import { supabase } from './lib/supabase';

async function verifyAdmin() {
  const email = 'admin@admin.com';
  const password = 'Admin123456!';

  try {
    // Try to sign in with the admin account
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Failed to sign in:', error.message);
      
      // Try to create a new admin account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email_confirmed: true,
            is_admin: true
          }
        }
      });

      if (signUpError) {
        console.error('Failed to create admin account:', signUpError.message);
      } else {
        console.log('Admin account created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
      }
    } else {
      console.log('Successfully signed in as admin!');
      console.log('Email:', email);
      console.log('Password:', password);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Exit the process since we're done
    process.exit(0);
  }
}

verifyAdmin();