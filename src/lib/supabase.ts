import { createClient } from '@supabase/supabase-js';
import { postcardNames, postcardUrl, stampUrlByName } from '$lib/images';

// These environment variables need to be set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a client that can be used in both browser and server
export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);

// Type for the postcard images
export interface PostcardImage {
  name: string;
  url: string;
}

// Postcard images (pre-optimised WebP served locally), newest first
export const fetchPostcardImages = async (): Promise<PostcardImage[]> =>
  postcardNames.map((name, i) => ({ name: `${name}.jpg`, url: postcardUrl(i + 1) }));

// Type for the stamp images
export interface StampImage {
  name: string;
  url: string;
}

// Stamp images (pre-optimised WebP served locally)
export const fetchStampImages = async (): Promise<StampImage[]> =>
  Array.from({ length: 14 }, (_, i) => {
    const name = `stamp${i + 1}.jpg`;
    return { name, url: stampUrlByName(name) };
  });

// Function to get a URL for a specific stamp by filename
export const getStampUrlByName = (filename: string): string | null => stampUrlByName(filename);
