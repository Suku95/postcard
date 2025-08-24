<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { imageStore } from '$lib/stores/images';
  import { stampStore } from '$lib/stores/stamps';
  import { goto } from '$app/navigation';
  
  export let data: PageData;

  let { postcard } = data;
  let postcardImageUrl: string | null = null;
  let stampImageUrl: string | null = null;
  let imageOnTop = false;

  onMount(() => {
    imageStore.loadImages();
    stampStore.loadStamps();

    if (postcard && postcard.selected_image_id) {
      postcardImageUrl = imageStore.getImageUrl(postcard.selected_image_id);
    }

    // Remove body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = ''; // Restore scroll on unmount
    };
  });

  imageStore.subscribe(storeState => {
    if (storeState.images && postcard && postcard.selected_image_id && !postcardImageUrl) {
       postcardImageUrl = imageStore.getImageUrl(postcard.selected_image_id);
    }
  });

  $: {
    if (postcard && postcard.selected_stamp_id) {
      if ($stampStore.images.length > 0) {
        stampImageUrl = stampStore.getStampUrl(postcard.selected_stamp_id);
      } else {
        stampImageUrl = stampStore.getStampUrl(postcard.selected_stamp_id);
      }
    } else {
      stampImageUrl = null;
    }
  }

  function toggleCardOrder() {
    imageOnTop = !imageOnTop;
  }

  function handleSendReply() {
    goto('/select');
  }

</script>

<svelte:head>
  <title>{postcard ? `${postcard.sender_name} sent you a postcard!` : 'A Postcard For You'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Courier+Prime&family=EB+Garamond&family=Jomhuria&family=Inter:wght@400;500&display=swap" rel="stylesheet">

</svelte:head>

{#if postcard}
<div class="w-full min-h-screen bg-white flex flex-col items-center justify-start pt-[50px] px-4 pb-4 sm:px-8 sm:pb-8 relative">
  <header class="w-full max-w-4xl mx-auto pb-8 text-center">
    <h1 class="text-[52px] font-normal text-black font-jomhuria">
      {postcard.sender_name} sent you a postcard!
      </h1>
  </header>

  <main class="flex-1 flex flex-col items-center justify-center w-full">
    <div class="relative scale-[0.9]" style="width: 600px; height: 600px;">
      <!-- Image Side -->
        <div 
          class="absolute -top-6 left-[72px] w-[450px] h-[600px] shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg overflow-hidden cursor-pointer transition-all duration-300" 
        style="transform: rotate({imageOnTop ? '0deg' : '12deg'}); background-color: {postcard.selected_color === '#FFEDB5' ? '#FFFCF2' : '#FFFFFF'}; z-index: {imageOnTop ? 20 : 10};"
        onclick={toggleCardOrder}
        role="button" tabindex="0" 
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCardOrder()}}
        >
          <div class="w-full h-full flex items-center justify-center">
            <div class="w-[406px] h-[509.49px] flex items-center justify-center">
            {#if postcardImageUrl}
              <img
                src={postcardImageUrl}
                alt="Postcard image"
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                <p class="text-gray-500">Loading image...</p>
              </div>
            {/if}
            </div>
          </div>
        </div>

      <!-- Written Side -->
        <div 
          class="absolute top-0 left-0 w-[600px] h-[450px] shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg p-6 bg-white cursor-pointer transition-all duration-300" 
        style="background-color: {postcard.selected_color}; z-index: {imageOnTop ? 10 : 20};"
        onclick={toggleCardOrder}
        role="button" tabindex="0" 
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCardOrder()}}
        >
          <div class="w-full h-full rounded relative">
          {#if stampImageUrl}
            <div class="absolute top-0 right-0">
              <img 
                src={stampImageUrl} 
                alt={`Stamp`} 
                class="w-16 h-20 object-contain rounded-sm"
              />
            </div>
          {/if}
            <div class="flex h-full">
              <div class="flex-1 relative">
              <div class="w-full h-full text-2xl {postcard.selected_font === 'Caveat' ? 'font-caveat' : postcard.selected_font === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'}"
                style="font-size: {postcard.selected_font === 'Caveat' ? '26px' : '20px'}; white-space: pre-wrap; word-break: break-word;"
                >
                {postcard.message}
              </div>
                </div>
            <div class="w-[256px] flex flex-col relative border-l" style="border-color: {postcard.selected_color === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">
              <div class="absolute right-0 top-0 h-full flex items-center -mr-12">
                <span class="transform rotate-90 origin-center text-[10px] tracking-[0.2em] font-medium" style="color: {postcard.selected_color === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">POST CARD</span>
              </div>
              <div class="absolute left-[6px] top-[410px]">
                 <span class="block transform -rotate-90 origin-top-left text-[10px] whitespace-nowrap" style="color: {postcard.selected_color === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">© {new Date(postcard.created_at).getFullYear()} {postcard.sender_name}</span>
                </div>
                <div class="pl-8 pr-6 mt-auto mb-16 relative">
                <p class="text-base mb-4" style="color: {postcard.selected_color === '#FFFFFF' ? '#B7B7B7' : '#C1AA8E'};">To</p>
                <div class="w-full h-[168px] {postcard.selected_font === 'Caveat' ? 'font-caveat' : postcard.selected_font === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'} lined-textarea"
                  style="font-size: {postcard.selected_font === 'Caveat' ? '26px' : '20px'}; --line-color: {postcard.selected_color === '#FFFFFF' ? '#E9E9E9' : '#E4CE9E'}; white-space: pre-wrap; word-break: break-word;"
                  >
                  {postcard.recipient_info}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="w-full max-w-7xl mx-auto p-4 sm:p-6 flex justify-between items-center fixed bottom-0 left-0 right-0">
    <span class="text-xs text-gray-500">© 2025 sendapostcard.art</span>
        <a 
      href="/select" 
          target="_blank"
          rel="noopener noreferrer"
      class="px-6 py-3 bg-black text-white rounded-[12px] flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors text-sm font-medium"
      aria-label="Send a reply (opens in a new tab)"
        >
      Send a reply
      <span class="material-symbols-outlined text-base font-normal leading-none">arrow_forward</span>
        </a>
  </footer>

      </div>
  {:else}
  <div class="w-full h-screen flex items-center justify-center">
    <p class="text-xl text-gray-600">Loading postcard...</p>
  </div>
  {/if}

<style>
  :global(.font-jomhuria) { font-family: 'Jomhuria', cursive; }
  :global(.font-caveat) { font-family: 'Caveat', cursive; }
  :global(.font-courier-prime) { font-family: 'Courier Prime', monospace; }
  :global(.font-eb-garamond) { font-family: 'EB Garamond', serif; }
  :global(.font-inter) { font-family: 'Inter', sans-serif; }

  .lined-textarea {
    background-image: repeating-linear-gradient(transparent, transparent 41px, var(--line-color, #E9E9E9) 41px, var(--line-color, #E9E9E9) 42px);
    line-height: 42px;
    padding: 0;
  }
</style> 