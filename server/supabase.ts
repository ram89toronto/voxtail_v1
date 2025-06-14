import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Make Supabase optional for development
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper function to upload files to Supabase storage
export async function uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data;
}

// Helper function to get public URL for uploaded files
export function getPublicUrl(bucket: string, path: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// Helper function to delete files from Supabase storage
export async function deleteFile(bucket: string, path: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
