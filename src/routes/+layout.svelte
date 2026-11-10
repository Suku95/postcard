<script lang="ts">
	import '../app.css';
</script>

<svelte:head>
	<title>Postcards by Suku</title>
	<meta name="description" content="Send hand-designed digital postcards with love." />

	<!-- Open Graph -->
	<meta property="og:title" content="Postcards by Suku" />
	<meta property="og:description" content="Send hand-designed digital postcards with love." />
	<meta property="og:image" content="https://postcards-weld.vercel.app/og-preview.jpg" />
	<meta property="og:url" content="https://postcards-weld.vercel.app/" />
	<meta property="og:type" content="website" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Postcards by Suku" />
	<meta name="twitter:description" content="Send hand-designed digital postcards with love." />
	<meta name="twitter:image" content="https://postcards-weld.vercel.app/og-preview.jpg" />

</svelte:head>

<slot />
