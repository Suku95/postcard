// Downloads the original postcard/stamp images from Supabase and writes
// compressed WebP versions into static/optimized so they're served from the
// app's own CDN with long-lived caching.
//
// Usage: node scripts/optimize-images.mjs
// Re-run after adding a new postcard (add its name to POSTCARDS first).
import sharp from 'sharp';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://djefjmucdhbrngeqovuz.supabase.co/storage/v1/object/public';
const OUT = path.resolve('static/optimized');

const POSTCARD_COUNT = 26;
const STAMP_COUNT = 17;

const jobs = [];
for (let i = 1; i <= POSTCARD_COUNT; i++) {
	jobs.push({ src: `${BASE}/postcard-images/img${i}.jpg`, name: `img${i}`, dir: 'postcards', full: 1400, thumb: 640 });
}
for (let i = 1; i <= STAMP_COUNT; i++) {
	jobs.push({ src: `${BASE}/stamp-images/stamp${i}.jpg`, name: `stamp${i}`, dir: 'stamps', full: 320 });
}
jobs.push({ src: `${BASE}/stamp-images/india-stamp.png`, name: 'india-stamp', dir: 'stamps', full: 320 });
jobs.push({ src: `${BASE}/postcard-images//Self_Portrait_1.jpg`, name: 'self-portrait', dir: 'misc', full: 600 });

const force = process.argv.includes('--force');
const exists = (p) => access(p).then(() => true, () => false);

async function run(job) {
	const fullPath = path.join(OUT, job.dir, `${job.name}.webp`);
	if (!force && (await exists(fullPath))) return `skip ${job.name}`;
	const res = await fetch(job.src);
	if (!res.ok) return `MISSING ${job.src} (${res.status})`;
	const buf = Buffer.from(await res.arrayBuffer());
	await mkdir(path.dirname(fullPath), { recursive: true });
	const img = sharp(buf).rotate();
	await writeFile(fullPath, await img.clone().resize({ width: job.full, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer());
	if (job.thumb) {
		const thumbPath = path.join(OUT, job.dir, 'thumb', `${job.name}.webp`);
		await mkdir(path.dirname(thumbPath), { recursive: true });
		await writeFile(thumbPath, await img.clone().resize({ width: job.thumb, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer());
	}
	return `ok ${job.name} (${(buf.length / 1024).toFixed(0)}KB original)`;
}

const results = [];
for (let i = 0; i < jobs.length; i += 6) {
	results.push(...(await Promise.all(jobs.slice(i, i + 6).map(run))));
}
console.log(results.join('\n'));
