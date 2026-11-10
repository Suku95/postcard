import { writable, get } from 'svelte/store';
import { postcardNames, postcardUrl, postcardThumbUrl } from '$lib/images';

export interface PostcardImage {
  name: string;
  url: string;
}

interface ImageStore {
  images: PostcardImage[];
  isLoading: boolean;
  error: string | null;
}

// Image list is static, so populate it immediately (no async round-trip).
const allImages: PostcardImage[] = postcardNames.map((name, i) => ({
  name: `${name}.jpg`,
  url: postcardUrl(i + 1)
}));

function createImageStore() {
  const store = writable<ImageStore>({ images: allImages, isLoading: false, error: null });

  return {
    subscribe: store.subscribe,
    loadImages: async () => get(store).images,
    getImageUrl: (imageNumber: number) => postcardUrl(imageNumber),
    getThumbUrl: (imageNumber: number) => postcardThumbUrl(imageNumber)
  };
}

export const imageStore = createImageStore();
