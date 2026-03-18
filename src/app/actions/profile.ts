'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { withErrorHandling } from '@/lib/server-utils';
import { ProfileSchema } from '@/lib/validations';

/**
 * Fetches the profile of the currently authenticated user.
 */
export async function getProfile() {
  return withErrorHandling(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, phone_number, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    return profile;
  }, "getProfile");
}

/**
 * Updates or creates a profile for the currently authenticated user.
 * Specifically used to collect the business mobile number.
 */
export async function updateProfile(data: { full_name?: string, phone_number: string }) {
  return withErrorHandling(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Data Validation
    const validatedData = ProfileSchema.parse(data);

    const profileData = {
      id: user.id,
      email: user.email!,
      full_name: validatedData.full_name || user.user_metadata?.full_name || 'Merchant Owner',
      phone_number: validatedData.phone_number,
    };

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/onboarding');
    return updatedProfile;
  }, "updateProfile");
}
