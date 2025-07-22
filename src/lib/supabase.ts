import { createClient } from '@supabase/supabase-js';

// These environment variables need to be set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log(supabaseUrl, supabaseAnonKey);
console.log('TEST VAR:', import.meta.env.VITE_TEST_VAR);

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

// Function to fetch images from the postcard-images storage bucket
export const fetchPostcardImages = async (): Promise<PostcardImage[]> => {
  // Filenames exactly as in Supabase, in order
  const filenames = [
    'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg',
    'img6.jpg', 'img7.jpg', 'img8.jpg', 'img9.jpg', 'img10.jpg', 'img11.jpg',
    'img12.jpg', 'img13.jpg', 'img14.jpg', 'img15.jpg', 'img16.jpg',
    'img17.jpg', 'img18.jpg', 'img19.jpg', 'img20.jpg', 'img21.jpg', 'img22.jpg', 'img23.jpg'
  ];

  const urlBase = 'https://djefjmucdhbrngeqovuz.supabase.co/storage/v1/object/public/postcard-images/';
  const images = filenames.map(name => ({
    name,
    url: urlBase + name
  }));
  return images;
};

// Type for the stamp images
export interface StampImage {
  name: string;
  url: string;
}

// Function to fetch stamp images from the stamp-images storage bucket
export const fetchStampImages = async (): Promise<StampImage[]> => {
  // Assuming 14 stamps based on existing data
  const filenames = Array.from({ length: 14 }, (_, i) => `stamp${i + 1}.jpg`);
  const urlBase = `${supabaseUrl}/storage/v1/object/public/stamp-images/`;

  if (!supabaseUrl) {
    console.error("Supabase URL is not configured. Cannot fetch stamp images.");
    return [];
  }

  const images = filenames.map(name => ({
    name,
    url: urlBase + name
  }));
  console.log('Fetched stamp images:', images);
  return images;
};

// Function to get a public URL for a specific stamp by filename
export const getStampUrlByName = (filename: string): string | null => {
  if (!supabaseUrl) {
    console.error("Supabase URL is not configured. Cannot get stamp URL.");
    return null;
  }
  const urlBase = `${supabaseUrl}/storage/v1/object/public/stamp-images/`;
  return urlBase + filename;
}; 