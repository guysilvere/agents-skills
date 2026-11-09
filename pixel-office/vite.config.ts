import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: [
			'pixel-office.test',
			'www.pixel-office.test',
			'pixeloffice.test',
			'www.pixeloffice.test',
			'pixel-office.localhost',
			'www.pixel-office.localhost',
			'.test'
		]
	}
});
