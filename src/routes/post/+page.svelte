<script lang="ts">
  import { ArrowLeft } from "lucide-svelte";
  import { page } from "$app/stores";
  import { postcardStore } from "$lib/stores/postcard";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { generateRandomName } from "$lib/utils/random-name";
  import ScaleToFit from "$lib/components/ScaleToFit.svelte";
  import { handOffKeyboard } from "$lib/keyboard";
  let nameInputEl: HTMLInputElement | null = null;
  import { artworkInFront, ARTWORK_BEHIND } from '$lib/postcardLayout';
  let viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  $: isPhone = viewportWidth > 0 && viewportWidth <= 480;

  // Phones: the name + share buttons are docked to the bottom of the screen and
  // ride on top of the on-screen keyboard. keyboardOffset = how much of the
  // layout viewport the keyboard covers (0 when it's closed).
  let keyboardOffset = 0;
  onMount(() => {
    // Phones: land with the keyboard open on the name field (held open by the editor's tap)
    handOffKeyboard(nameInputEl);

    const vv = window.visualViewport;
    if (!vv) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        if (offset !== keyboardOffset) keyboardOffset = offset;
      });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  });
  import { supabase } from '$lib/supabaseClient';
  import { imageStore } from '$lib/stores/images';
  import { stampStore } from '$lib/stores/stamps';
  
  let userName = "";
  let colorCloseTimeout: ReturnType<typeof setTimeout>;
  let isColorSelectorOpen = false;
  let message = "";
  let recipientInfo = "";
  let selectedFont = "";
  let selectedColor = "";
  let selectedImage = 0;
  let copySuccess = false;
  let copyTimeout: ReturnType<typeof setTimeout>;
  let imageOnTop = false;
  let shareId = "";
  let showEmailTooltip = false;
  let currentPostcardImageUrl: string | null = null;
  let viewParam = '';

  // Get stamp from store
  let currentStampPath: string | null = null;
  let currentStampName = `Stamp ${$postcardStore.selectedStamp}`;
  
  // Subscribe to the store
  postcardStore.subscribe(store => {
    message = store.message;
    recipientInfo = store.recipientInfo;
    selectedFont = store.selectedFont;
    selectedColor = store.selectedColor;
    selectedImage = Number(store.selectedImage);
    currentStampPath = stampStore.getStampUrl($postcardStore.selectedStamp);
    currentStampName = `Stamp ${$postcardStore.selectedStamp}`;
  });
  
  // Subscribe to imageStore for image URL
  imageStore.subscribe(storeState => {
    if (storeState.images && selectedImage > 0 && selectedImage <= storeState.images.length) {
      currentPostcardImageUrl = storeState.images[selectedImage - 1]?.url || null;
    } else {
      currentPostcardImageUrl = null;
    }
  });
  
  // Update image URL when selectedImage changes
  $: if (selectedImage > 0 && imageStore) {
    const url = imageStore.getImageUrl(selectedImage);
    currentPostcardImageUrl = url && url.length > 0 ? url : null;
  }
  
  $: viewParam = $page.url.searchParams.get('view') || '';
  
  function handleEmailIt() {
    // TODO: Implement email functionality
    console.log("Emailing postcard...");
  }
  
  // Save runs in the background so the link is copied (and confirmed) instantly
  async function savePostcard(id: string): Promise<boolean> {
    const postcardData = {
      id,
      sender_name: userName,
      message,
      recipient_info: recipientInfo,
      selected_font: selectedFont,
      selected_color: selectedColor,
      selected_image_id: selectedImage,
      selected_stamp_id: $postcardStore.selectedStamp,
      created_at: new Date().toISOString()
    };
    const { error: insertError } = await supabase.from('postcards-created').insert(postcardData);
    if (!insertError) return true;

    console.error('Error saving postcard to Supabase:', insertError);
    // The copied link points at a postcard that doesn't exist, so withdraw it
    shareId = '';
    copySuccess = false;
    alert(
      insertError.code === '23505'
        ? 'Failed to generate a unique link ID due to a conflict. Please tap "Copy link to share" again.'
        : `Couldn't save your postcard, so the copied link won't work yet. Please try again. (${insertError.message})`
    );
    return false;
  }

  function showCopied() {
    copySuccess = true;
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copySuccess = false;
    }, 1500);
  }

  async function handleCopyLink() {
    // ID is generated on the device, so the link is known before saving
    if (!shareId) {
      shareId = generateRandomName();
      savePostcard(shareId);
    }
    const shareUrl = `${window.location.origin}/p/${shareId}`;

    // Copy synchronously within the tap (Safari rejects clipboard writes after a network wait)
    try {
      await navigator.clipboard.writeText(shareUrl);
      showCopied();
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert(`Couldn't copy automatically. Here's your link:\n${shareUrl}`);
    }
  }

  function handleColorMenuLeave() {
    colorCloseTimeout = setTimeout(() => {
      isColorSelectorOpen = false;
    }, 100);
  }

  function toggleCardOrder() {
    imageOnTop = !imageOnTop;
  }

  function handleBack(event: Event) {
    event.preventDefault();
    goto(`/select${viewParam === 'grid' ? '?view=grid' : ''}`);
  }

  onMount(() => {
    imageStore.loadImages();
    stampStore.loadStamps();
    return () => {
      clearTimeout(copyTimeout);
      clearTimeout(colorCloseTimeout);
    };
  });
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<svelte:head>
</svelte:head>

<div class="w-full min-h-[100dvh] bg-white flex flex-col">
  <!-- Header -->
  <header class="max-w-[1201px] mx-auto h-[104px] mobile:h-[72px] px-4 relative w-full">
    <div class="absolute left-1/2 -translate-x-1/2 top-[30px] mobile:top-[20px] mobile:inset-x-0 mobile:translate-x-0 mobile:justify-center flex items-center gap-4">
      <a href={`/select${viewParam === 'grid' ? '?view=grid' : ''}`} class="flex items-center text-[#3D3D3D] hover:text-black mobile:absolute mobile:left-4 mobile:p-2" onclick={handleBack} aria-label="Back to select">
        <ArrowLeft class="w-6 h-6" />
      </a>
      <h1 class="text-[52px] font-jomhuria leading-[52px] text-black whitespace-nowrap">Post</h1>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col items-center justify-center px-4 pb-8 mobile:pb-[260px] overflow-x-hidden">
    <!-- Postcard Container -->
    <div class="mt-[92px] mb-10 mobile:mt-6 mobile:mb-4">
    <ScaleToFit width={600} height={600} maxScale={0.89} overflow={80} phoneFill>
    <div class="relative pt-10" style="width: 600px; height: 600px;">
      <!-- Image Side (Bottom Layer) -->
      <div 
        class="absolute -top-6 left-[72px] w-[450px] h-[600px] shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg overflow-hidden cursor-pointer transition-all duration-300" 
        style="transform: {imageOnTop ? artworkInFront(viewportWidth) : ARTWORK_BEHIND}; transform-origin: center; background-color: {selectedColor === '#FFEDB5' ? '#FFFCF2' : '#FFFFFF'}; z-index: {imageOnTop ? 20 : 10};"
        onclick={() => toggleCardOrder()}
      >
        <div class="w-full h-full flex items-center justify-center">
          <div class="w-[406px] h-[509.49px] flex items-center justify-center">
            <img
              src={currentPostcardImageUrl || '/placeholder.png'}
              alt="Selected postcard"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- Written Side (Top Layer) -->
      <div 
        class="absolute top-0 left-0 w-[600px] h-[450px] shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg p-6 bg-white cursor-pointer transition-all duration-300" 
        style="background-color: {selectedColor}; z-index: {imageOnTop ? 10 : 20};"
        onclick={() => toggleCardOrder()}
      >
        <div class="w-full h-full rounded relative">
          <!-- Stamp -->
          <div class="absolute top-0 right-0">
            {#if currentStampPath}
            <img 
              src={currentStampPath} 
              alt={`${currentStampName} postage stamp`} 
              class="w-16 h-20 object-contain rounded-sm"
            />
            {:else if $stampStore.isLoading}
            <div class="w-16 h-20 flex items-center justify-center bg-gray-200 rounded-sm">
              <span class="text-xs text-gray-500">...</span>
            </div>
            {:else}
            <div class="w-16 h-20 flex items-center justify-center bg-gray-100 rounded-sm">
               <span class="text-xs text-red-500">!</span>
            </div>
            {/if}
          </div>

          <!-- Main Content Area -->
          <div class="flex h-full">
            <!-- Writing Area -->
            <div class="flex-1 min-w-0 relative pr-4">
              <div class="postcard-text w-full h-full text-2xl {selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'}"
                style="font-size: {selectedFont === 'Caveat' ? '26px' : '20px'};"
              >
                {message}
              </div>
            </div>

            <!-- Right Side with To Section -->
            <div class="w-[256px] flex flex-col relative border-l" style="border-color: {selectedColor === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">
              <!-- Post Card Text -->
              <div class="absolute right-0 top-0 h-full flex items-center -mr-12">
                <span class="transform rotate-90 origin-center text-[10px] tracking-[0.2em] font-medium" style="color: {selectedColor === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">POST CARD</span>
              </div>

              <!-- Copyright Text -->
              <div class="absolute left-[6px] top-[410px]">
                <span class="block transform -rotate-90 origin-top-left text-[10px] whitespace-nowrap" style="color: {selectedColor === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">© 2025 Sukanya Basu</span>
              </div>

              <!-- To Section -->
              <div class="pl-8 pr-6 mt-auto mb-16 relative">
                <p class="text-base mb-4" style="color: {selectedColor === '#FFFFFF' ? '#B7B7B7' : '#C1AA8E'};">To</p>
                <div class="postcard-text w-full h-[168px] {selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'} lined-textarea"
                  style="font-size: {selectedFont === 'Caveat' ? '26px' : '20px'}; --line-color: {selectedColor === '#FFFFFF' ? '#E9E9E9' : '#E4CE9E'};"
                >
                  {recipientInfo}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ScaleToFit>
    </div>

    <!-- Action Section (docked to the bottom on phones, above the keyboard when it's open) -->
    <div
      class="-mt-4 flex flex-col items-center mobile:fixed mobile:inset-x-0 mobile:bottom-0 mobile:z-30 mobile:mt-0 mobile:px-4 mobile:pt-4 mobile:bg-white/95 mobile:backdrop-blur-sm post-dock"
      style={isPhone
        ? `transform: translate3d(0, ${-keyboardOffset}px, 0); padding-bottom: ${keyboardOffset ? '12px' : 'max(16px, env(safe-area-inset-bottom, 0px))'};`
        : ''}
    >
      <div class="flex items-center justify-center gap-4 mobile:flex-col mobile:items-stretch mobile:gap-3 mobile:w-full">
        <!-- Name Input -->
        <div class="flex flex-col">
          <label class="block text-[#3D3D3D] text-sm mb-2">Name*</label>
          <input
            type="text"
            bind:this={nameInputEl}
            bind:value={userName}
            placeholder="Your name"
            autofocus
            autocapitalize="words"
            autocomplete="name"
            enterkeyhint="done"
            class="w-[260px] mobile:w-full h-12 px-4 bg-white border border-[#E5E5EA] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        <!-- Share buttons: side by side, equal width on phones -->
        <div class="flex items-center gap-4 mobile:grid mobile:grid-cols-2 mobile:gap-3 mobile:w-full">
        <!-- Copy Link Button (on the right on phones: the main action sits under the thumb) -->
        <button 
          class="mobile:order-2 h-12 px-6 mobile:px-2 mobile:min-w-0 mobile:gap-1.5 whitespace-nowrap bg-black text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-colors disabled:bg-[#F2F2F7] disabled:text-[#8E8E93] disabled:cursor-not-allowed mt-8 mobile:mt-0 relative"
          disabled={!userName.trim()}
          onclick={handleCopyLink}
        >
          <span class="material-symbols-outlined !text-[20px] !font-normal !leading-none flex items-center">link</span>
          <span class="text-sm mobile:text-[13px] font-medium">Copy link to share</span>
          {#if copySuccess}
            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Link copied! paste to share
            </div>
          {/if}
        </button>

        <!-- Disabled Email Button with Tooltip -->
        <button
          class="h-12 px-6 mobile:px-2 mobile:min-w-0 mobile:gap-1.5 whitespace-nowrap bg-black text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-[#F2F2F7] disabled:text-[#8E8E93] disabled:cursor-not-allowed mt-8 mobile:mt-0 relative"
          disabled
          aria-label="Email (coming soon)"
          tabindex="-1"
          onmouseenter={() => showEmailTooltip = true}
          onmouseleave={() => showEmailTooltip = false}
        >
          <span class="material-symbols-outlined !text-[20px] !font-normal !leading-none flex items-center">mail</span>
          <span class="text-sm mobile:text-[13px] font-medium">Email</span>
          {#if showEmailTooltip}
            <div class="absolute -top-[44px] left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded whitespace-nowrap z-20 shadow-lg" role="tooltip">
              For now, you have to copy link and share — Email sending is coming soon!
            </div>
          {/if}
        </button>
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  .post-dock {
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  :global(.font-jomhuria) {
    font-family: 'Jomhuria', cursive;
  }

  :global(.font-caveat) {
    font-family: 'Caveat', cursive;
  }

  :global(.font-courier-prime) {
    font-family: 'Courier Prime', monospace;
  }

  :global(.font-eb-garamond) {
    font-family: 'EB Garamond', serif;
  }

  .lined-textarea {
    background-image: repeating-linear-gradient(transparent, transparent 41px, var(--line-color, #E9E9E9) 41px, var(--line-color, #E9E9E9) 42px);
    line-height: 42px;
    padding: 0;
  }
</style> 