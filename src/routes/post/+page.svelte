<script lang="ts">
  import { ArrowLeft } from "lucide-svelte";
  import { page } from "$app/stores";
  import { postcardStore } from "$lib/stores/postcard";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { generateRandomName } from "$lib/utils/random-name";
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
  
  async function handleCopyLink() {
    try {
      if (!shareId) { // If no shareId exists for this session yet (i.e., not successfully saved)
        const newShareId = generateRandomName(); // Generate a potential new ID
        
        const postcardData = {
          id: newShareId, // Use the new ID for this save attempt
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

        if (insertError) {
          console.error('Error saving postcard to Supabase:', insertError);
          if (insertError.code === '23505') { // PostgreSQL unique_violation error code
            alert('Failed to generate a unique link ID due to a conflict. Please try copying the link again.');
          } else {
            alert(`Failed to save postcard: ${insertError.message}`);
          }
          return; // Exit without copying or setting the component's shareId
        }
        // If save was successful, persist this newShareId for the current session
        shareId = newShareId;
      }

      // If we reach here, shareId is set (either from a previous success or just now)
      const shareUrl = `${window.location.origin}/p/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      copySuccess = true;
      
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copySuccess = false;
      }, 1000);

    } catch (err) { // Catch errors from clipboard API or other unexpected issues
      console.error('Failed to copy link or unexpected error:', err);
      alert('Failed to copy link. Please try again.');
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

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Courier+Prime&family=EB+Garamond&family=Jomhuria&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
</svelte:head>

<div class="w-full h-screen bg-white flex flex-col">
  <!-- Header -->
  <header class="max-w-[1201px] mx-auto h-[104px] sm:h-[104px] px-4 relative">
    <div class="absolute left-1/2 -translate-x-1/2 top-[30px] flex items-center gap-4">
      <a href={`/select${viewParam === 'grid' ? '?view=grid' : ''}`} class="flex items-center text-[#3D3D3D] hover:text-black" onclick={handleBack} aria-label="Back to select">
        <ArrowLeft class="w-6 h-6" />
      </a>
      <h1 class="text-[52px] font-jomhuria leading-[52px] text-black whitespace-nowrap">Post</h1>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col items-center justify-center px-4 pb-8">
    <!-- Postcard Container -->
    <div class="relative pt-10 scale-[0.89] mt-[92px]" style="width: 600px; height: 600px;">
      <!-- Image Side (Bottom Layer) -->
      <div 
        class="absolute -top-6 left-[72px] w-[450px] h-[600px] shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg overflow-hidden cursor-pointer transition-all duration-300" 
        style="transform: rotate({imageOnTop ? '0deg' : '12deg'}); background-color: {selectedColor === '#FFEDB5' ? '#FFFCF2' : '#FFFFFF'}; z-index: {imageOnTop ? 20 : 10};"
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
            <div class="flex-1 relative">
              <div class="w-full h-full text-2xl {selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'}"
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
                <div class="w-full h-[168px] {selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'} lined-textarea"
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

    <!-- Action Section -->
    <div class="-mt-4 flex flex-col items-center">
      <div class="flex items-center justify-center gap-4">
        <!-- Name Input -->
        <div class="flex flex-col">
          <label class="block text-[#3D3D3D] text-sm mb-2">Name*</label>
          <input
            type="text"
            bind:value={userName}
            placeholder="Your name"
            autofocus
            class="w-[260px] h-12 px-4 bg-white border border-[#E5E5EA] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>

        <!-- Copy Link Button -->
        <button 
          class="h-12 px-6 bg-black text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-colors disabled:bg-[#F2F2F7] disabled:text-[#8E8E93] disabled:cursor-not-allowed mt-8 relative"
          disabled={!userName.trim()}
          onclick={handleCopyLink}
        >
          <span class="material-symbols-outlined !text-[20px] !font-normal !leading-none flex items-center">link</span>
          <span class="text-sm font-medium">Copy link to share</span>
          {#if copySuccess}
            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Link copied! paste to share
            </div>
          {/if}
        </button>

        <!-- Disabled Email Button with Tooltip -->
        <button
          class="h-12 px-6 bg-black text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-[#F2F2F7] disabled:text-[#8E8E93] disabled:cursor-not-allowed mt-8 relative"
          disabled
          aria-label="Email (coming soon)"
          tabindex="-1"
          onmouseenter={() => showEmailTooltip = true}
          onmouseleave={() => showEmailTooltip = false}
        >
          <span class="material-symbols-outlined !text-[20px] !font-normal !leading-none flex items-center">mail</span>
          <span class="text-sm font-medium">Email</span>
          {#if showEmailTooltip}
            <div class="absolute -top-[44px] left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded whitespace-nowrap z-20 shadow-lg" role="tooltip">
              For now, you have to copy link and share — Email sending is coming soon!
            </div>
          {/if}
        </button>
      </div>
    </div>
  </main>
</div>

<style>
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