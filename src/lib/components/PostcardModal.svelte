<script lang="ts">
  import { X } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { imageStore } from '$lib/stores/images';

  export let isOpen: boolean = false;
  export let imageNumber: number = 1;
  export let onClose: () => void;
  export let onEdit: () => void;
  export let onNext: () => void;
  export let onPrevious: () => void;

  let currentImageUrl: string = '';
  let isLoading = true;
  let error: string | null = null;
  let imageLoaded = false;
  const loadedUrls = new Set<string>();

  // Subscribe to the store
  $: ({ isLoading, error } = $imageStore);

  // Update image URL when imageNumber changes
  $: if (isOpen) {
    const nextUrl = imageStore.getImageUrl(imageNumber);
    if (nextUrl !== currentImageUrl) {
      currentImageUrl = nextUrl;
      imageLoaded = loadedUrls.has(nextUrl);
    }
    if (!$imageStore.images.length) {
      imageStore.loadImages();
    }
  }

  function handleImageLoad() {
    loadedUrls.add(currentImageUrl);
    imageLoaded = true;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowRight') {
      onNext();
    } else if (event.key === 'ArrowLeft') {
      onPrevious();
    } else if (event.key === 'Enter') {
      onEdit();
    }
    
    // Prevent all keyboard events while modal is open
    event.stopPropagation();
  }

  // Add/remove event listeners and scroll lock
  $: if (browser && isOpen) {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown, true);
  } else if (browser) {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', handleKeydown, true);
  }

  // Swipe left/right on touch screens to browse postcards
  let swipeStartX = 0;
  let swipeStartY = 0;
  function handleSwipeStart(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
  }
  function handleSwipeEnd(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNext();
      else onPrevious();
    }
  }

  onMount(() => {
    return () => {
      if (browser) {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeydown, true);
      }
    };
  });
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center"
    transition:fade={{ duration: 200 }}
  >
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-white/80 backdrop-blur-sm"
      onclick={onClose}
    >
      <!-- Close button -->
      <button
        class="absolute right-6 top-6 mobile:right-3 mobile:top-3 p-2 hover:bg-black/5 rounded-full"
        onclick={onClose}
      >
        <X class="w-6 h-6 text-[#3D3D3D]" />
      </button>
    </div>
    
    <!-- Modal content -->
    <div
      class="relative z-10 -translate-y-6 touch-pan-y"
      onpointerdown={handleSwipeStart}
      onpointerup={handleSwipeEnd}
    >
      <!-- Image -->
      <div class="bg-white p-4 shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] w-[453.6px] mobile:w-[calc(100vw-32px)]">
        <div class="h-[560px] mobile:h-auto mobile:aspect-[409/560] flex justify-center items-center">
          {#if isLoading && !currentImageUrl}
            <div class="text-gray-500">Loading...</div>
          {:else if error}
            <div class="text-red-500">{error}</div>
          {:else if currentImageUrl}
          <img
              src={currentImageUrl}
            alt="Selected postcard"
            class="w-[409.248px] mobile:w-full h-full object-cover select-none transition-opacity duration-300 {imageLoaded ? 'opacity-100' : 'opacity-0'}"
            draggable="false"
            decoding="async"
            fetchpriority="high"
            onload={handleImageLoad}
              onerror={() => { error = 'Failed to load image'; }}
          />
          {:else}
            <div class="text-gray-500">No image available</div>
          {/if}
        </div>
      </div>

      <!-- Like button -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(100%+24px)]">
        <button
          onclick={onEdit}
          class="bg-black text-white p-4 rounded-[12px] text-base font-inter font-medium hover:bg-black/90 transition-colors inline-flex items-center gap-2"
        >
          Post <span class="text-sm">→</span>
        </button> 
      


      </div>
    </div>
  </div>
{/if} 