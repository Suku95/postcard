<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { Loader2, RotateCw } from "lucide-svelte";
  import { stampStore } from "$lib/stores/stamps";

  let isLoading = true;
  let isFlipped = false;
  let senderName = "";
  let message = "";
  let recipientInfo = "";
  let selectedFont = "Caveat";
  let selectedColor = "#FFFFFF";
  let selectedImage = 1;
  let imageOnTop = false;
  let indiaStampUrl: string | null = null;

  const supabaseUrlBase = 'https://djefjmucdhbrngeqovuz.supabase.co/storage/v1/object/public/postcard-images/';
  const supabaseFilenames = [
    'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg',
    'img6.jpg', 'img7.jpg', 'img8.jpg', 'img10.jpg', 'img11.jpg',
    'img12.jpg', 'img13.jpg', 'img14.jpg', 'img15.jpg', 'img16.jpg',
    'img17.jpg', 'img18.jpg', 'img19.jpg', 'img20.jpg', 'img21.jpg', 'img22.jpg', 'img23.jpg'
  ];

  onMount(() => {
    stampStore.loadStamps();
    indiaStampUrl = stampStore.getStampUrlByName('india-stamp.png');

    // Decode the base64 URL parameter to get the postcard data
    try {
      const encodedData = $page.params.id;
      const decodedData = JSON.parse(atob(encodedData));
      
      senderName = decodedData.senderName;
      message = decodedData.message;
      recipientInfo = decodedData.recipientInfo;
      selectedFont = decodedData.selectedFont;
      selectedColor = decodedData.selectedColor;
      selectedImage = decodedData.selectedImage;
      
      isLoading = false;
    } catch (error) {
      console.error('Error decoding postcard data:', error);
    }
  });

  function handleFlip() {
    isFlipped = !isFlipped;
  }

  function toggleCardOrder() {
    imageOnTop = !imageOnTop;
  }

  // Function to get the correct image extension
  function getSupabaseImageUrl(imageNum: number): string {
    return `${supabaseUrlBase}${supabaseFilenames[imageNum - 1]}`;
  }
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Courier+Prime&family=EB+Garamond&family=Jomhuria&display=swap" rel="stylesheet">
</svelte:head>

<div class="w-full min-h-screen bg-white flex flex-col items-center justify-start pt-8 pb-16 px-4">
  {#if isLoading}
    <div class="flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-black" />
    </div>
  {:else}
    <!-- Header -->
    <h1 class="text-[40px] font-jomhuria leading-[40px] text-black mb-16">{senderName} sent you a postcard!</h1>

    <div class="postcard-wrapper w-full">
    <!-- Postcard Container -->
      <div class="relative postcard" style="width: 600px; height: 600px;">
      <!-- Image Side (Bottom Layer) -->
      <div 
        class="absolute -top-6 left-[72px] w-[450px] h-[600px] shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg overflow-hidden cursor-pointer transition-all duration-300" 
        style="transform: rotate({imageOnTop ? '0deg' : '12deg'}); background-color: {selectedColor === '#FFEDB5' ? '#FFFCF2' : '#FFFFFF'}; z-index: {imageOnTop ? 20 : 10};"
        onclick={() => toggleCardOrder()}
      >
        <div class="w-full h-full flex items-center justify-center">
          <div class="w-[406px] h-[509.49px] flex items-center justify-center">
            <img
              src={getSupabaseImageUrl(selectedImage)}
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

              <!-- Stamp -->
              <div class="absolute top-4 right-4">
                  {#if indiaStampUrl}
                  <img src={indiaStampUrl} alt="India postage stamp" class="w-16 h-20 object-contain" />
                  {:else}
                  <!-- Placeholder for stamp if URL is not yet available -->
                  <div class="w-16 h-20 bg-gray-200 rounded-sm"></div>
                  {/if}
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
    </div>

    <!-- Send Reply Button -->
    <div class="mt-16">
      <a 
        href="/select"
        class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
      >
        <span class="text-sm font-medium">Send a reply →</span>
      </a>
    </div>

    <!-- Footer -->
    <div class="mt-auto pt-8 text-center px-4">
      <p class="text-sm text-[#8E8E93]">© 2025 Postcardit.com</p>
    </div>
  {/if}
</div>

<style>
  .perspective-1000 {
    perspective: 1000px;
    transform-origin: center center;
  }

  .transform-style-preserve-3d {
    transform-style: preserve-3d;
    transform-origin: center center;
  }

  .backface-hidden {
    backface-visibility: hidden;
    transform-origin: center center;
  }

  .rotate-y-180 {
    transform: rotateY(180deg) rotate(90deg);
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

  .postcard-wrapper {
    overflow-x: auto;
  }
  .postcard {
    margin: 0;
  }

  @media (min-width: 640px) {
    .postcard-wrapper {
        overflow: visible;
    }
    .postcard {
        margin: 0 auto;
    }
  }
</style> 