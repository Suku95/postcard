<script lang="ts">
  import { ArrowLeft, Type, RotateCw, Palette, Send } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { page } from "$app/stores";
  import { scale } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { postcardStore } from "$lib/stores/postcard";
  import { stampStore } from "$lib/stores/stamps";
  import { onMount, tick } from "svelte";
  import { postcardUrl } from "$lib/images";
  import { holdKeyboardForNextPage, handOffKeyboard } from "$lib/keyboard";
  
  let isFlipped = false;
  let isFontSelectorOpen = false;
  let isColorSelectorOpen = false;
  let closeTimeout: ReturnType<typeof setTimeout>;
  let colorCloseTimeout: ReturnType<typeof setTimeout>;
  let isStampHovered = false;

  // Initialize local state
  let message = $postcardStore.message;
  let recipientInfo = $postcardStore.recipientInfo;
  let selectedFont = $postcardStore.selectedFont;
  let selectedColor = $postcardStore.selectedColor;

  let currentStampName = `Stamp ${$postcardStore.selectedStamp}`;
  let currentStampPath: string | null = null;

  onMount(() => {
    stampStore.loadStamps();
    if (!$postcardStore.selectedStamp || $postcardStore.selectedStamp < 1 || $postcardStore.selectedStamp > 14 ) {
        const randomStampIndex = Math.floor(Math.random() * 14) + 1;
  postcardStore.update(store => ({
    ...store,
    selectedStamp: randomStampIndex
  }));
    }
  });

  $: {
    if ($stampStore.images.length > 0 && $postcardStore.selectedStamp > 0) {
      currentStampPath = stampStore.getStampUrl($postcardStore.selectedStamp);
      currentStampName = `Stamp ${$postcardStore.selectedStamp}`;
    } else if ($postcardStore.selectedStamp > 0) {
      currentStampPath = stampStore.getStampUrl($postcardStore.selectedStamp);
      currentStampName = `Stamp ${$postcardStore.selectedStamp}`;
    }
  }

  // Update store when values change
  $: {
    postcardStore.set({
      ...($postcardStore),
      message,
      recipientInfo,
      selectedFont,
      selectedColor,
      selectedImage: $page.url.searchParams.get('image') || '1',
    });
  }
  
  const fonts = [
    { name: "Caveat", preview: "Aa", class: "font-caveat" },
    { name: "Courier Prime", preview: "Aa", class: "font-courier-prime" },
    { name: "EB Garamond", preview: "Aa", class: "font-eb-garamond" }
  ];

  const colors = [
    { value: "#FFFFFF", label: "White" },
    { value: "#FFEDB5", label: "Indian yellow" }
  ];
  
  // ---- Responsive sizing + mobile keyboard handling ----
  const MOBILE_MAX = 480; // keep in sync with the 'mobile' screen in tailwind.config.ts
  // Read the real size up front so phones never flash the desktop card layout
  let innerWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  let innerHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  let vvHeight = 0;   // visible height (shrinks when the on-screen keyboard opens)
  let keyboardOpen = false;

  onMount(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let frame = 0;
    // Only the keyboard opening/closing changes our layout. Batch to one update per
    // frame and skip no-op changes, so typing never triggers a re-render.
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const h = Math.round(vv.height);
        if (h !== vvHeight) vvHeight = h;
        const open = window.innerHeight - vv.height > 120;
        if (open !== keyboardOpen) keyboardOpen = open;
        // The editor already fits the visible area, so undo Safari's scroll-into-view
        // instead of moving the layout to follow it (that chase made typing feel laggy)
        if (window.scrollY !== 0) window.scrollTo(0, 0);
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

  $: isMobile = innerWidth > 0 && innerWidth <= MOBILE_MAX;
  $: viewHeight = vvHeight || innerHeight;
  // Small tablets still use the card layout: give the card room while typing
  $: hideHeader = !isMobile && keyboardOpen && innerWidth < 640;
  $: toolbarBottom = keyboardOpen ? 12 : isMobile ? 24 : 60;

  // ---- Phone editor: full-screen writing, one side of the card at a time ----
  // Two sides on phones: the writing side (message + "To" on one scrolling page)
  // and the artwork side, like turning the postcard over.
  let mobileSide: 'write' | 'artwork' = 'write';
  let mobileMessageEl: HTMLTextAreaElement | null = null;
  let mobileScrollEl: HTMLDivElement | null = null;

  async function toggleMobileSide() {
    mobileSide = mobileSide === 'write' ? 'artwork' : 'write';
    if (mobileSide === 'artwork') {
      // Nothing to type on the picture side: put the keyboard away
      (document.activeElement as HTMLElement | null)?.blur();
      return;
    }
    await tick();
    fitMessage();
    mobileMessageEl?.focus({ preventScroll: true });
  }

  // The message box grows with its text, pushing "To" further down the page
  function fitMessage() {
    const el = mobileMessageEl;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  // While typing at the end of the message, keep the caret line in view
  function handleMessageInput() {
    fitMessage();
    const el = mobileMessageEl;
    const scroller = mobileScrollEl;
    if (!el || !scroller || el.selectionEnd !== el.value.length) return;
    const caretBottom = el.offsetTop + el.offsetHeight + 24;
    const visibleBottom = scroller.scrollTop + scroller.clientHeight;
    if (caretBottom > visibleBottom) scroller.scrollTop = caretBottom - scroller.clientHeight;
  }

  // Font size changes the text height
  $: if (fontClass && mobileMessageEl) tick().then(fitMessage);

  onMount(() => {
    // Open straight into typing on phones (keyboard held open by the select page's tap)
    fitMessage();
    handOffKeyboard(mobileMessageEl);
  });

  // Keep the keyboard open when tapping toolbar buttons (stops the textarea losing focus)
  function keepFocus(e: Event) {
    if ((e.target as Element | null)?.closest('button')) e.preventDefault();
  }

  $: fontClass = selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond';
  $: fontSize = selectedFont === 'Caveat' ? '26px' : '20px';
  $: placeholderColor = selectedColor === '#FFFFFF' ? '#CCCCCC' : '#C1AA8E';
  // Space kept clear above and below the card so it stays exactly centred
  $: headerSpace = hideHeader ? 0 : isMobile ? 72 : 120;
  $: toolbarSpace = toolbarBottom + 52 + (keyboardOpen ? 8 : 16);
  $: reserved = 2 * Math.max(headerSpace, toolbarSpace);
  // Visual footprint: 600x450 normally, 450x600 when flipped (rotated 90deg)
  $: boxW = isFlipped ? 450 : 600;
  $: boxH = isFlipped ? 600 : 450;
  $: cardScale = innerWidth
    ? Math.max(0.3, Math.min(1, (innerWidth - 32) / boxW, (viewHeight - reserved) / boxH))
    : 1;

  // ---- Toolbar menus: hover with a mouse, tap on touch screens ----
  let lastPointerType = 'mouse';

  function handleWindowPointerDown(e: PointerEvent) {
    lastPointerType = e.pointerType;
    const target = e.target as Element | null;
    if (!target?.closest('.edit-toolbar')) {
      isFontSelectorOpen = false;
      isColorSelectorOpen = false;
    }
  }

  function mouseOnly(fn: () => void) {
    return (e: PointerEvent) => { if (e.pointerType === 'mouse') fn(); };
  }

  function toggleFontMenu() {
    if (lastPointerType === 'mouse') return;
    isFontSelectorOpen = !isFontSelectorOpen;
    isColorSelectorOpen = false;
  }

  function toggleColorMenu() {
    if (lastPointerType === 'mouse') return;
    isColorSelectorOpen = !isColorSelectorOpen;
    isFontSelectorOpen = false;
  }

  function handleFontSelect(font: string) {
    selectedFont = font;
    if (lastPointerType !== 'mouse') isFontSelectorOpen = false;
  }

  function handleColorSelect(color: string) {
    selectedColor = color;
    if (lastPointerType !== 'mouse') isColorSelectorOpen = false;
  }

  function handleFlip() {
    // Close the keyboard: the picture side has nothing to type into
    (document.activeElement as HTMLElement | null)?.blur();
    isFlipped = !isFlipped;
  }
  
  function handleSend() {
    // Phones: keep the keyboard up so the Post page opens with the name field ready
    holdKeyboardForNextPage();
    goto('/post');
  }

  function handleFontMenuEnter() {
    clearTimeout(closeTimeout);
    isFontSelectorOpen = true;
  }

  function handleFontMenuLeave() {
    closeTimeout = setTimeout(() => {
      isFontSelectorOpen = false;
    }, 100);
  }

  function handleColorMenuEnter() {
    clearTimeout(colorCloseTimeout);
    isColorSelectorOpen = true;
  }

  function handleColorMenuLeave() {
    colorCloseTimeout = setTimeout(() => {
      isColorSelectorOpen = false;
    }, 100);
  }

  function handleChangeStamp() {
    const currentIndex = $postcardStore.selectedStamp;
    let newIndex;
    const maxStamps = $stampStore.images.length > 0 ? $stampStore.images.length : 14;
    do {
      newIndex = Math.floor(Math.random() * maxStamps) + 1;
    } while (newIndex === currentIndex);
    
    postcardStore.update(store => ({
      ...store,
      selectedStamp: newIndex
    }));
  }
  function getSupabaseImageUrl(imageNum: number) {
    return postcardUrl(imageNum);
  }

  // Function to get the correct image extension
  function getImagePath(imageNum: number): string {
    return getSupabaseImageUrl(imageNum);
  }
</script>

<svelte:head>
</svelte:head>

<svelte:window bind:innerWidth bind:innerHeight onpointerdown={handleWindowPointerDown} />

<div
  class="fixed inset-x-0 top-0 w-full bg-white overflow-hidden overscroll-none"
  style="height: {vvHeight ? `${vvHeight}px` : '100dvh'}; {isMobile ? `background-color: ${selectedColor};` : ''}"
>
  {#if isMobile}
  <!-- Phone header -->
  <header class="absolute inset-x-0 top-0 z-10 h-[88px] flex items-center justify-center px-14">
    <a href="/select" class="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#3D3D3D]" aria-label="Back to postcards">
      <ArrowLeft class="w-6 h-6" />
    </a>
    <h1 class="text-[48px] font-jomhuria leading-[48px] text-black whitespace-nowrap pt-2">Edit postcard</h1>
  </header>
  {:else}
  <!-- Header -->
  <header class="absolute inset-x-0 top-0 z-10 max-w-[1201px] mx-auto h-[104px] mobile:h-[72px] px-4 pointer-events-none" class:hidden={hideHeader}>
    <div class="absolute left-1/2 -translate-x-1/2 top-[30px] mobile:top-[20px] flex items-center gap-4 mobile:gap-2 pointer-events-auto whitespace-nowrap">
      <a href="/select" class="flex items-center text-[#3D3D3D] hover:text-black">
        <ArrowLeft class="w-6 h-6" />
      </a>
      <h1 class="text-[52px] font-jomhuria leading-[52px] text-black">Edit your postcard</h1>
    </div>
  </header>
  {/if}

  <!-- Main Content -->
  <main class="h-full flex flex-col items-center justify-center px-4">
    {#if isMobile}
    <!-- Phone editor: write directly on the page, keyboard below the toolbar -->
    <div
      class="absolute inset-x-0 top-[88px] flex flex-col"
      style="bottom: calc({toolbarBottom + 72}px + {keyboardOpen ? '0px' : 'env(safe-area-inset-bottom, 0px)'});"
    >
      {#if mobileSide === 'write'}
        <!-- One scrolling page: message first, "To" below it -->
        <div bind:this={mobileScrollEl} class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6">
          <textarea
            bind:this={mobileMessageEl}
            bind:value={message}
            oninput={handleMessageInput}
            rows="1"
            placeholder="Write here"
            aria-label="Message"
            autocapitalize="sentences"
            autocomplete="off"
            spellcheck="true"
            enterkeyhint="enter"
            class="block w-full min-h-[200px] p-0 resize-none overflow-hidden border-none focus:outline-none focus:ring-0 bg-transparent caret-[#0A84FF] {fontClass}"
            style="color: #000000; font-size: {fontSize}; line-height: 1.5; --placeholder-color: {placeholderColor};"
          ></textarea>

          <div class="mt-11">
            <p class="text-base mb-2" style="color: {selectedColor === '#FFFFFF' ? '#B7B7B7' : '#C1AA8E'};">To</p>
            <textarea
              bind:value={recipientInfo}
              placeholder="Name"
              aria-label="Recipient"
              autocapitalize="words"
              autocomplete="off"
              enterkeyhint="done"
              class="block w-full h-[168px] resize-none border-none focus:outline-none focus:ring-0 bg-transparent caret-[#0A84FF] lined-textarea {fontClass}"
              style="color: #000000; font-size: {fontSize}; --placeholder-color: {placeholderColor}; --line-color: {selectedColor === '#FFFFFF' ? '#E9E9E9' : '#E4CE9E'};"
            ></textarea>
          </div>
        </div>
      {:else}
        <!-- Picture side of the postcard -->
        <div class="flex-1 min-h-0 flex items-center justify-center py-4">
          <img
            src={getImagePath(parseInt($page.url.searchParams.get('image') || '1'))}
            alt="Your postcard artwork"
            class="max-w-full max-h-full object-contain p-3 rounded-sm shadow-[0px_20px_50px_rgba(12,12,13,0.12)] select-none"
            style="background-color: {selectedColor === '#FFEDB5' ? '#FFFCF2' : '#FFFFFF'};"
            draggable="false"
          />
        </div>
      {/if}
    </div>
    {:else}
    <!-- Postcard -->
    <!-- Box sized to the scaled card so it stays centred at any screen size -->
    <div class="relative shrink-0 card-box" style="width: {boxW * cardScale}px; height: {boxH * cardScale}px;">
    <div
      class="absolute left-1/2 top-1/2 perspective-1000 card-scaler"
      style="width: 600px; height: 450px; transform: translate(-50%, -50%) scale({cardScale});"
    >
      <div class="w-full h-full transition-all duration-350 transform-style-preserve-3d relative will-change-transform" 
        style="transform: {isFlipped ? 'rotateY(180deg) rotate(90deg)' : 'none'}; transition: transform 0.35s cubic-bezier(0.3, 0, 0.2, 1);"
      >
        <!-- Front Side -->
        <div class="absolute w-full h-full shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg backface-hidden will-change-transform" 
          style="background-color: {selectedColor}; transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);"
        >
          <div class="w-full h-full rounded relative p-6">
            <!-- Stamp -->
            <button 
              type="button"
              class="absolute top-4 right-4 cursor-pointer focus:outline-none w-16 h-20"
              onpointerenter={mouseOnly(() => (isStampHovered = true))}
              onpointerleave={mouseOnly(() => (isStampHovered = false))}
              onclick={handleChangeStamp}
            >
              <div class="relative w-full h-full">
                {#if currentStampPath}
                <img 
                  src={currentStampPath} 
                  alt={`${currentStampName} postage stamp`} 
                  class="w-16 h-20 object-contain rounded-sm transition-opacity duration-200 pointer-events-none"
                  style="opacity: {isStampHovered ? '0.5' : '1'}"
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
                {#if isStampHovered && currentStampPath}
                  <div 
                    class="absolute inset-0 flex items-center justify-center pointer-events-none"
                    transition:scale={{ duration: 200, start: 0.95 }}
                  >
                    <span class="material-symbols-outlined text-white text-[24px]">wand_stars</span>
                  </div>
                {/if}
              </div>
            </button>

            <!-- Main Content Area -->
            <div class="flex h-full">
              <!-- Writing Area -->
              <div class="flex-1 relative">
                <textarea
                  bind:value={message}
                  placeholder="Write here"
                  autocapitalize="sentences"
                  autocomplete="off"
                  spellcheck="true"
                  enterkeyhint="enter"
                  class="w-full h-full resize-none border-none focus:outline-none focus:ring-0 text-2xl bg-transparent {selectedFont === 'Caveat' ? 'placeholder:text-[26px]' : 'placeholder:text-[20px]'} {selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'}"
                  style="color: #000000; font-size: {selectedFont === 'Caveat' ? '26px' : '20px'}; --placeholder-color: {selectedColor === '#FFFFFF' ? '#CCCCCC' : '#C1AA8E'};"
                ></textarea>
              </div>

              <!-- Right Side with To Section -->
              <div class="w-[256px] flex flex-col relative border-l" style="border-color: {selectedColor === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">
                <!-- Post Card Text -->
                <div class="absolute right-0 top-0 h-full flex items-center -mr-12">
                  <span class="transform rotate-90 origin-center text-[10px] tracking-[0.2em] font-medium" style="color: {selectedColor === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">POST CARD</span>
                </div>

                <!-- Copyright Text -->
                <div class="absolute left-[6px] top-[380px]">
                  <span class="block transform -rotate-90 origin-top-left text-[10px] whitespace-nowrap" style="color: {selectedColor === '#FFFFFF' ? '#E5E5E5' : '#E4CE9E'};">© 2025 Sukanya Basu</span>
                </div>

                <!-- To Section -->
                <div class="pl-8 pr-6 mt-auto mb-16 relative">
                  <p class="text-base mb-4" style="color: {selectedColor === '#FFFFFF' ? '#B7B7B7' : '#C1AA8E'};">To</p>
                  <textarea
                    bind:value={recipientInfo}
                    placeholder="Name"
                    autocapitalize="words"
                    autocomplete="off"
                    enterkeyhint="done"
                    class="w-full resize-none border-none focus:outline-none focus:ring-0 text-2xl bg-transparent {selectedFont === 'Caveat' ? 'placeholder:text-[26px]' : 'placeholder:text-[20px]'} h-[168px] lined-textarea {selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'}"
                    style="color: #000000; font-size: {selectedFont === 'Caveat' ? '26px' : '20px'}; --placeholder-color: {selectedColor === '#FFFFFF' ? '#CCCCCC' : '#C1AA8E'}; --line-color: {selectedColor === '#FFFFFF' ? '#E9E9E9' : '#E4CE9E'};"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Back Side -->
        <div class="absolute w-full h-full shadow-[0px_30.29px_83.51px_rgba(12,12,13,0.10)] rounded-lg backface-hidden" 
          style="transform: rotateY(180deg); background-color: {selectedColor === '#FFEDB5' ? '#FFFCF2' : '#FFFFFF'};"
        >
          <div class="w-full h-full flex items-center justify-center">
            <div class="w-[406px] h-[509.49px] flex items-center justify-center">
              <img
                src={getImagePath(parseInt($page.url.searchParams.get('image') || '1'))}
                alt="Selected postcard"
                class="w-full h-full object-cover transform rotate-90"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    {/if}

    <!-- Toolbar (sits just above the on-screen keyboard while typing) -->
    <div
      class="edit-toolbar absolute left-1/2 -translate-x-1/2 z-20"
      style="bottom: calc({toolbarBottom}px + {keyboardOpen ? '0px' : 'env(safe-area-inset-bottom, 0px)'});"
      onpointerdown={keepFocus}
      onmousedown={keepFocus}
    >
      <div class="inline-flex items-center bg-white rounded-xl mobile:rounded-2xl shadow-[0px_2px_20px_rgba(0,0,0,0.1)] p-1 mobile:p-1.5 mobile:gap-2">
        <!-- Font Selector -->
        <div class="relative">
          <button 
            class="w-11 h-11 flex items-center justify-center rounded-[12px] hover:bg-[#F2F2F7] text-[#3D3D3D] transition-colors"
            aria-label="Font"
            onpointerenter={mouseOnly(handleFontMenuEnter)}
            onpointerleave={mouseOnly(handleFontMenuLeave)}
            onclick={toggleFontMenu}
          >
            <span class="{selectedFont === 'Caveat' ? 'font-caveat' : selectedFont === 'Courier Prime' ? 'font-courier-prime' : 'font-eb-garamond'} {selectedFont === 'Caveat' ? 'text-[24px]' : 'text-[20px]'}">Aa</span>
          </button>

          {#if isFontSelectorOpen}
            <div 
              class="font-selector-menu absolute top-0 left-0 -translate-y-full bg-white rounded-[12px] shadow-[0px_2px_20px_rgba(0,0,0,0.1)] overflow-hidden min-w-[120px] transition-all duration-200 ease-out origin-bottom-left mt-[-8px]"
              in:scale={{ duration: 200, start: 0.95, opacity: 0 }}
              out:scale={{ duration: 150, start: 0.95, opacity: 0 }}
              onpointerenter={mouseOnly(handleFontMenuEnter)}
              onpointerleave={mouseOnly(handleFontMenuLeave)}
            >
              {#each fonts as font}
                <button
                  class="w-full h-11 px-4 flex items-center justify-between hover:bg-[#F2F2F7] transition-colors {selectedFont === font.name ? 'bg-black text-white hover:bg-black' : ''}"
                  onclick={() => handleFontSelect(font.name)}
                >
                  <span class="{font.class} {font.name === 'Caveat' ? 'text-[24px]' : 'text-[20px]'}">{font.preview}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if isMobile}
        <!-- Switch between message and address side -->
        <button
          class="w-11 h-11 flex items-center justify-center rounded-[12px] text-[#3D3D3D] transition-colors {mobileSide === 'artwork' ? 'bg-[#F2F2F7]' : ''}"
          aria-label={mobileSide === 'write' ? 'Show the artwork' : 'Back to writing'}
          aria-pressed={mobileSide === 'artwork'}
          onclick={toggleMobileSide}
        >
          <span class="material-symbols-outlined text-[24px]">flip</span>
        </button>
        {/if}

        <!-- Color Selector -->
        <div class="relative">
          <button 
            class="w-11 h-11 flex items-center justify-center rounded-[12px] hover:bg-[#F2F2F7] transition-colors"
            aria-label="Card colour"
            onpointerenter={mouseOnly(handleColorMenuEnter)}
            onpointerleave={mouseOnly(handleColorMenuLeave)}
            onclick={toggleColorMenu}
          >
            <div class="w-5 h-5 rounded-full border border-[#E5E5EA]" style="background-color: {selectedColor};"></div>
          </button>

          {#if isColorSelectorOpen}
            <div 
              class="color-selector-menu absolute top-0 left-0 -translate-y-full bg-white rounded-[12px] shadow-[0px_2px_20px_rgba(0,0,0,0.1)] overflow-hidden min-w-[120px] transition-all duration-200 ease-out origin-bottom-left mt-[-8px]"
              in:scale={{ duration: 200, start: 0.95, opacity: 0 }}
              out:scale={{ duration: 150, start: 0.95, opacity: 0 }}
              onpointerenter={mouseOnly(handleColorMenuEnter)}
              onpointerleave={mouseOnly(handleColorMenuLeave)}
            >
              {#each colors as color}
                <button
                  class="w-full h-11 px-4 flex items-center justify-between hover:bg-[#F2F2F7] transition-colors {selectedColor === color.value ? 'bg-black hover:bg-black' : ''}"
                  onclick={() => handleColorSelect(color.value)}
                >
                  <div class="flex items-center gap-3">
                    <div class="w-5 h-5 rounded-full border border-[#E5E5EA] flex-shrink-0" style="background-color: {color.value};"></div>
                    <span class="text-sm whitespace-nowrap {selectedColor === color.value ? 'text-white' : 'text-[#3D3D3D]'}">{color.label}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if !isMobile}
        <!-- Flip Button -->
        <button class="w-11 h-11 flex items-center justify-center rounded-[12px] hover:bg-[#F2F2F7] text-[#3D3D3D] transition-colors" onclick={handleFlip} aria-label="Flip postcard">
          <RotateCw class="w-5 h-5" />
        </button>
        {/if}

        <!-- Separator -->
        <div class="w-[1px] h-5 bg-[#E5E5EA] mx-1"></div>

        <!-- Send Button -->
        <button 
          class="h-11 px-3 mobile:w-12 mobile:h-12 mobile:px-0 mobile:justify-center rounded-[12px] flex items-center gap-2 transition-colors {message.trim() ? 'bg-black text-white hover:bg-[#1A1A1A]' : 'bg-[#F2F2F7] text-[#8E8E93] cursor-not-allowed'}"
          onclick={handleSend}
          disabled={!message.trim()}
          aria-label="Post"
        >
          <span class="text-sm font-medium mobile:hidden">Post</span>
          <Send class="w-4 h-4 mobile:w-5 mobile:h-5" />
        </button>
      </div>
    </div>
  </main>
</div>

<style>
  .card-box {
    transition: width 0.35s cubic-bezier(0.3, 0, 0.2, 1), height 0.35s cubic-bezier(0.3, 0, 0.2, 1);
  }

  .card-scaler {
    transition: transform 0.35s cubic-bezier(0.3, 0, 0.2, 1);
  }

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

  textarea::placeholder {
    color: var(--placeholder-color) !important;
  }

  .font-selector-menu::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 4px;
    background: transparent;
  }

  .color-selector-menu::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 4px;
    background: transparent;
  }

  /* Add smooth transitions for all transformations */
  .transition-all {
    transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
  }

  /* Optimize performance */
  .will-change-transform {
    will-change: transform;
  }
</style> 