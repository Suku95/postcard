import { writable, get } from 'svelte/store';
import { stampUrlByName as fetchStampUrlByName } from '$lib/images';

export interface StampImage {
  name: string;
  url: string;
}

const fetchStampImages = async (): Promise<StampImage[]> =>
  Array.from({ length: 14 }, (_, i) => {
    const name = `stamp${i + 1}.jpg`;
    return { name, url: fetchStampUrlByName(name) };
  });

interface StampStore {
  images: StampImage[];
  isLoading: boolean;
  error: string | null;
}

const createStampStore = () => {
  const { subscribe, set, update } = writable<StampStore>({
    images: [],
    isLoading: false,
    error: null,
  });

  async function loadStamps() {
    if (get(stampStore).images.length > 0 || get(stampStore).isLoading) return;

    update(store => ({ ...store, isLoading: true, error: null }));
    try {
      const fetchedImages = await fetchStampImages();
      set({ images: fetchedImages, isLoading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error loading stamp images:', errorMessage);
      set({ images: [], isLoading: false, error: errorMessage });
    }
  }

  function getStampUrl(stampNumber: number): string | null {
    const store = get(stampStore);
    if (!store.images || store.images.length === 0) {
      // Attempt to construct URL optimistically if stamps are not loaded yet or if it's a direct call
      // This assumes stamp names are like 'stamp1.jpg', 'stamp2.jpg', etc.
      // And that supabase.ts will construct the base URL correctly even if env vars are initially missing client-side.
      const imageName = `stamp${stampNumber}.jpg`;
      const potentialUrl = fetchStampUrlByName(imageName);
      if (!potentialUrl) {
        console.warn(`Could not construct URL for stamp number ${stampNumber} before stamps loaded and Supabase URL might be missing.`);
        return '/images/stamps/stamp1.jpg'; // Fallback to a default static image to prevent UI breaks
      }
      return potentialUrl;
    }
    const image = store.images.find(img => img.name === `stamp${stampNumber}.jpg`);
    return image ? image.url : null;
  }

 function getStampUrlByName(filename: string): string | null {
    const store = get(stampStore);
    // First, try to find it in the loaded images in case it's part of the standard set
    const image = store.images.find(img => img.name === filename);
    if (image) return image.url;

    // If not found, attempt to construct URL optimistically
    const potentialUrl = fetchStampUrlByName(filename);
    if (!potentialUrl) {
        console.warn(`Could not construct URL for stamp name ${filename} and Supabase URL might be missing.`);
        return '/images/stamps/stamp1.jpg'; // Fallback for safety
    }
    return potentialUrl;
  }

  return {
    subscribe,
    loadStamps,
    getStampUrl,
    getStampUrlByName
  };
};

export const stampStore = createStampStore(); 