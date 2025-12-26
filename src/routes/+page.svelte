<script context="module" lang="ts">
  export const ssr = false;
</script>
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { X, ArrowLeft, ArrowRight } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { onMount } from 'svelte';

  const MAX_IMAGES = 7; // Update this when adding more images

  function getRandomImageNumbers(count: number): number[] {
    const numbers = Array.from({ length: MAX_IMAGES }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers.slice(0, count);
  }

  const randomImages = getRandomImageNumbers(4);

  const supabaseUrlBase = 'https://djefjmucdhbrngeqovuz.supabase.co/storage/v1/object/public/postcard-images/';
  const supabaseFilenames = [
    'img25.jpg','img24.jpg', 'img23.jpg', 'img22.jpg', 'img21.jpg', 'img20.jpg',
    'img19.jpg', 'img18.jpg', 'img17.jpg', 'img16.jpg', 'img15.jpg', 'img14.jpg',
    'img13.jpg', 'img12.jpg', 'img11.jpg', 'img10.jpg', 'img9.jpg',
    'img8.jpg', 'img7.jpg', 'img6.jpg', 'img5.jpg', 'img4.jpg', 'img3.jpg', 'img2.jpg', 'img1.jpg'
  ];

  function navigateToSelect() {
    goto('/select');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      navigateToSelect();
    } else if (event.key === 'Escape') {
      navigateToSelect();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<svelte:head>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Jomhuria&family=Inter:wght@400;500&family=Caveat:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>



<div class="w-screen h-screen relative bg-white overflow-hidden font-inter">
  <div class="w-full h-full relative">
    <!-- Backdrop overlay -->
    <div class="w-full h-full absolute inset-0 bg-white backdrop-blur-[4px]"></div>

    <!-- Close button -->
    <button
      class="w-[36px] h-[36px] absolute right-4 sm:right-6 top-4 sm:top-6 flex items-center justify-center hover:opacity-80"
      onclick={navigateToSelect}
    >
      <X class="w-[18px] h-[18px] text-[#AEAEB2]" strokeWidth={2} />
    </button>

    <!-- Main content -->
    <div class="absolute left-1/2 top-[15%] sm:top-[20%] -translate-x-1/2 flex flex-col items-center gap-[32px] w-[min(445px,90%)] px-4 sm:px-0">
      <div class="flex flex-col items-center gap-[12px] w-full">
        <div class="text-center text-black text-[48px] sm:text-[64px] font-jomhuria font-normal w-full leading-[48px] sm:leading-[64px]">Send a postcard</div>

        <div class="text-center font-caveat text-[22px] sm:text-[26px] leading-[1.5] text-black px-[2px]">
          There was a time when sending a postcard meant - slowing down to share a moment, a thought, or a feeling with friends and family far away. I've always loved that. This is my way of bringing back that magic digitally. <br> In a world of instant messages, here's a space for art, memories, and words. Each postcard features artwork I've created over the years, and will keep adding to. Enjoy! <br> ~Sukanya
        </div>
      </div>

      <!-- Enter button -->
      <div class="w-fit h-[48px] sm:h-[52px] flex flex-col items-center gap-[6px]">
        <button
          type="button"
          onclick={navigateToSelect}
          class="px-[16px] sm:px-[20px] py-[12px] sm:py-[14px] bg-black hover:bg-black/90 rounded-xl flex justify-center items-center gap-2"
        >
          <span class="text-white text-[16px] sm:text-[17px] leading-[20px] sm:leading-[22px]">Enter</span>
          <ArrowRight class="w-[16px] sm:w-[18px] h-[10px] sm:h-[12px] text-white" />
        </button>
      </div>
    </div>

    <!-- Postcards with responsive positioning -->
    <div class="hidden lg:block">
      <!-- Bottom left postcard -->
      <div class="absolute w-[276.77px] h-[369.02px] left-[5%] bottom-[15%] [transform:rotate(3.81deg)] origin-top-left">
        <div class="w-full h-full bg-white shadow-[0px_4px_4px_-4px_rgba(12,12,13,0.05)] p-[13.67px]">
          <img src={`${supabaseUrlBase}${supabaseFilenames[randomImages[0] - 1]}`} class="w-full h-full object-cover" alt="Decorative postcard" />
        </div>
      </div>

      <!-- Top left postcard -->
      <div class="absolute w-[264px] h-[352px] left-[2%] top-[20%] [transform:rotate(-6deg)] origin-top-left">
        <div class="w-full h-full bg-white shadow-[0px_4px_4px_-4px_rgba(12,12,13,0.05)] p-[13.04px]">
          <img src={`${supabaseUrlBase}${supabaseFilenames[randomImages[1] - 1]}`} class="w-full h-full object-cover" alt="Decorative postcard" />
        </div>
      </div>

      <!-- Top right postcard -->
      <div class="absolute w-[264px] h-[352px] right-[5%] top-[20%] [transform:rotate(6.61deg)] origin-top-right">
        <div class="w-full h-full bg-white shadow-[0px_4px_4px_-4px_rgba(12,12,13,0.05)] p-[13.04px]">
          <img src={`${supabaseUrlBase}${supabaseFilenames[randomImages[2] - 1]}`} class="w-full h-full object-cover" alt="Decorative postcard" />
        </div>
      </div>

      <!-- Bottom right postcard -->
      <div class="absolute w-[260px] h-[346.67px] right-[8%] bottom-[12%] [transform:rotate(-5.03deg)] origin-bottom-right">
        <div class="w-full h-full bg-white shadow-[0px_4px_4px_-4px_rgba(12,12,13,0.05)] p-[12.04px]">
          <img src={`${supabaseUrlBase}${supabaseFilenames[randomImages[3] - 1]}`} class="w-full h-full object-cover" alt="Decorative postcard" />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .font-jomhuria {
    font-family: 'Jomhuria', cursive;
  }
  .font-caveat {
    font-family: 'Caveat', cursive;
  }
</style>
