<script lang="ts">
  // Scales a fixed-size design (e.g. the 600px postcard) down to fit the
  // viewport width, reserving layout space for the scaled size.
  export let width: number;
  export let height: number;
  export let maxScale = 1;
  /** Horizontal space to leave free (page gutters), in px. */
  export let gutter = 32;
  /** Extra visual overflow beyond `width` (e.g. rotated cards), in px. */
  export let overflow = 0;
  /** On phones (≤480px), fill the width exactly, leaving only the gutter. */
  export let phoneFill = false;

  let innerWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  $: fill = phoneFill && innerWidth > 0 && innerWidth <= 480;
  $: scale = innerWidth
    ? Math.min(fill ? 1 : maxScale, (innerWidth - gutter) / (width + (fill ? 0 : overflow)))
    : maxScale;
</script>

<svelte:window bind:innerWidth />

<div class="relative shrink-0" style="width: {width * scale}px; height: {height * scale}px;">
  <div
    class="absolute left-0 top-0"
    style="width: {width}px; height: {height}px; transform: scale({scale}); transform-origin: top left;"
  >
    <slot />
  </div>
</div>
