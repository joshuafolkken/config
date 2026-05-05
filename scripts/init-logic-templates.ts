import type { ProjectType } from './init-logic'

// Template strings below contain `export default` as generated file content, not as module exports
const ESLINT_SVELTEKIT = `import { create_sveltekit_config } from '@joshuafolkken/kit/eslint/sveltekit'
import svelteConfig from './svelte.config.js'

export default create_sveltekit_config({
\tgitignore_path: new URL('./.gitignore', import.meta.url),
\ttsconfig_root_dir: import.meta.dirname,
\tsvelte_config: svelteConfig,
})
`

const ESLINT_VANILLA = `import { create_vanilla_config } from '@joshuafolkken/kit/eslint/vanilla'

export default create_vanilla_config({
\tgitignore_path: new URL('./.gitignore', import.meta.url),
\ttsconfig_root_dir: import.meta.dirname,
})
`

const DEFAULT_TAILWIND_STYLESHEET = './src/routes/layout.css'
const TAILWIND_STYLESHEET_PATTERN = /tailwindStylesheet"?:\s*['"]([^'"]+)['"]/u

const DEFAULT_DEV_PORT = 5173
const DEFAULT_PREVIEW_PORT = 4173
const DEV_PORT_PLACEHOLDER = '__DEV_PORT__'
const PREVIEW_PORT_PLACEHOLDER = '__PREVIEW_PORT__'
const DEV_PORT_PATTERN = /(?:DEV_PORT\s*=|dev_port:)\s*(\d+)/u
const PREVIEW_PORT_PATTERN = /(?:PREVIEW_PORT\s*=|preview_port:)\s*(\d+)/u

const PLAYWRIGHT_CONFIG_TEMPLATE = `import { defineConfig, devices } from '@playwright/test'

const IS_CI = Boolean(process.env['CI'])

const DEV_PORT = __DEV_PORT__
const PREVIEW_PORT = __PREVIEW_PORT__

const CI_TIMEOUT = 15_000
const LOCAL_TIMEOUT = 25_000
const TEST_TIMEOUT = 10_000
const EXPECT_TIMEOUT = 5_000
const ACTION_TIMEOUT = 5_000
const NAVIGATION_TIMEOUT = 10_000
const CI_WORKERS = 2
const CI_RETRIES = 2
const VIEWPORT_WIDTH = 1_280
const VIEWPORT_HEIGHT = 720

const web_server_config = IS_CI
\t? { command: 'pnpm run preview', port: PREVIEW_PORT, timeout: CI_TIMEOUT, reuseExistingServer: false }
\t: { command: 'pnpm run dev', port: DEV_PORT, timeout: LOCAL_TIMEOUT, reuseExistingServer: true }

export default defineConfig({
\twebServer: web_server_config,
\ttestDir: 'e2e',
\tfullyParallel: true,
\t...(IS_CI ? { workers: CI_WORKERS } : {}),
\tretries: IS_CI ? CI_RETRIES : 0,
\ttimeout: TEST_TIMEOUT,
\texpect: { timeout: EXPECT_TIMEOUT },
\tprojects: [
\t\t{
\t\t\tname: 'chromium',
\t\t\tuse: {
\t\t\t\t...devices['Desktop Chrome'],
\t\t\t\tviewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
\t\t\t\tlaunchOptions: {
\t\t\t\t\targs: ['--disable-dev-shm-usage', '--disable-gpu', ...(IS_CI ? ['--no-sandbox'] : [])],
\t\t\t\t},
\t\t\t},
\t\t},
\t],
\treporter: IS_CI ? [['html'], ['github']] : [['html'], ['list']],
\tuse: {
\t\tactionTimeout: ACTION_TIMEOUT,
\t\tnavigationTimeout: NAVIGATION_TIMEOUT,
\t\tscreenshot: IS_CI ? 'only-on-failure' : 'off',
\t\tvideo: IS_CI ? 'retain-on-failure' : 'off',
\t\ttrace: IS_CI ? 'retain-on-failure' : 'off',
\t},
})
`

const VITE_CONFIG_SVELTEKIT = `import type { UserConfig, ConfigEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
\tplugins: [
\t\tsveltekit(),
\t\t{
\t\t\t...visualizer({ open: !process.env['CI'], filename: 'stats-client.html' }),
\t\t\tapply: (config: UserConfig, { command }: ConfigEnv) =>
\t\t\t\tcommand === 'build' && !config.build?.ssr,
\t\t},
\t\t{
\t\t\t...visualizer({ open: !process.env['CI'], filename: 'stats-server.html' }),
\t\t\tapply: (config: UserConfig, { command }: ConfigEnv) =>
\t\t\t\tcommand === 'build' && !!config.build?.ssr,
\t\t},
\t],
})
`

function generate_eslint_config(type: ProjectType): string {
	return type === 'sveltekit' ? ESLINT_SVELTEKIT : ESLINT_VANILLA
}

function generate_prettier_config(stylesheet: string = DEFAULT_TAILWIND_STYLESHEET): string {
	return `import { config } from '@joshuafolkken/kit/prettier'

export default {
\t...config,
\ttailwindStylesheet: '${stylesheet}',
}
`
}

function merge_prettier_config(existing: string): string {
	const match = TAILWIND_STYLESHEET_PATTERN.exec(existing)

	return generate_prettier_config(match?.[1] ?? DEFAULT_TAILWIND_STYLESHEET)
}

function generate_playwright_config(
	development_port: number = DEFAULT_DEV_PORT,
	preview_port: number = DEFAULT_PREVIEW_PORT,
): string {
	return PLAYWRIGHT_CONFIG_TEMPLATE.replace(DEV_PORT_PLACEHOLDER, String(development_port)).replace(
		PREVIEW_PORT_PLACEHOLDER,
		String(preview_port),
	)
}

function merge_playwright_config(existing: string): string {
	const development_port = Number(DEV_PORT_PATTERN.exec(existing)?.[1] ?? DEFAULT_DEV_PORT)
	const preview_port = Number(PREVIEW_PORT_PATTERN.exec(existing)?.[1] ?? DEFAULT_PREVIEW_PORT)

	return generate_playwright_config(development_port, preview_port)
}

function generate_vite_config(): string {
	return VITE_CONFIG_SVELTEKIT
}

const init_logic_templates = {
	generate_eslint_config,
	generate_prettier_config,
	merge_prettier_config,
	generate_playwright_config,
	merge_playwright_config,
	generate_vite_config,
}

export { init_logic_templates }
