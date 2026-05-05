import { describe, expect, it } from 'vitest'
import { init_logic_templates } from './init-logic-templates'

const DEFAULT_STYLESHEET = "tailwindStylesheet: './src/routes/layout.css'"
const APP_CSS_STYLESHEET = "tailwindStylesheet: './src/app.css'"
const KIT_PRETTIER_IMPORT = "from '@joshuafolkken/kit/prettier'"

describe('init_logic_templates.generate_eslint_config', () => {
	it('returns sveltekit config for sveltekit project type', () => {
		expect(init_logic_templates.generate_eslint_config('sveltekit')).toContain(
			'create_sveltekit_config',
		)
	})

	it('returns vanilla config for vanilla project type', () => {
		expect(init_logic_templates.generate_eslint_config('vanilla')).toContain(
			'create_vanilla_config',
		)
	})
})

describe('init_logic_templates.generate_prettier_config', () => {
	it('contains the kit prettier module reference', () => {
		expect(init_logic_templates.generate_prettier_config()).toContain('@joshuafolkken/kit/prettier')
	})

	it('includes default tailwindStylesheet', () => {
		expect(init_logic_templates.generate_prettier_config()).toContain(DEFAULT_STYLESHEET)
	})

	it('uses provided stylesheet when given', () => {
		expect(init_logic_templates.generate_prettier_config('./src/app.css')).toContain(
			APP_CSS_STYLESHEET,
		)
	})
})

describe('init_logic_templates.merge_prettier_config', () => {
	it('preserves tailwindStylesheet from new template format', () => {
		const existing = `import { config } from '@joshuafolkken/kit/prettier'\n\nexport default {\n\t...config,\n\ttailwindStylesheet: './src/app.css',\n}\n`

		expect(init_logic_templates.merge_prettier_config(existing)).toContain(APP_CSS_STYLESHEET)
	})

	it('preserves tailwindStylesheet from old JSON format', () => {
		const existing = `{\n\t"useTabs": true,\n\t"tailwindStylesheet": "./src/app.css"\n}`

		expect(init_logic_templates.merge_prettier_config(existing)).toContain(APP_CSS_STYLESHEET)
	})

	it('uses default when existing file has no tailwindStylesheet', () => {
		const existing = `import { config } from '@joshuafolkken/kit/prettier'\n\nexport default {\n\t...config,\n}\n`

		expect(init_logic_templates.merge_prettier_config(existing)).toContain(DEFAULT_STYLESHEET)
	})

	it('rewrites old format to use kit prettier import', () => {
		const existing = `{\n\t"useTabs": true,\n\t"singleQuote": true\n}`

		expect(init_logic_templates.merge_prettier_config(existing)).toContain(KIT_PRETTIER_IMPORT)
	})
})

const DEFAULT_PLAYWRIGHT_CONFIG = `import { defineConfig, devices } from '@playwright/test'

const IS_CI = Boolean(process.env['CI'])

const DEV_PORT = 5173
const PREVIEW_PORT = 4173

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
const CUSTOM_DEV_PORT = 'DEV_PORT = 3000'
const CUSTOM_PREVIEW_PORT = 'PREVIEW_PORT = 8080'

const DEFAULT_DEV_PORT_LINE = 'DEV_PORT = 5173'
const DEFAULT_PREVIEW_PORT_LINE = 'PREVIEW_PORT = 4173'

describe('init_logic_templates.generate_playwright_config', () => {
	it('contains defineConfig and devices imports', () => {
		expect(init_logic_templates.generate_playwright_config()).toContain('defineConfig, devices')
	})

	it('uses default ports when no args given', () => {
		expect(init_logic_templates.generate_playwright_config()).toBe(DEFAULT_PLAYWRIGHT_CONFIG)
	})

	it('uses provided ports when given', () => {
		const result = init_logic_templates.generate_playwright_config(3000, 8080)

		expect(result).toContain(CUSTOM_DEV_PORT)
		expect(result).toContain(CUSTOM_PREVIEW_PORT)
	})
})

describe('init_logic_templates.merge_playwright_config', () => {
	it('preserves custom dev_port from old factory format', () => {
		const existing = `export default create_playwright_config({ dev_port: 3000, preview_port: 4173 })`

		expect(init_logic_templates.merge_playwright_config(existing)).toContain(CUSTOM_DEV_PORT)
	})

	it('preserves custom preview_port from old factory format', () => {
		const existing = `export default create_playwright_config({ dev_port: 5173, preview_port: 8080 })`

		expect(init_logic_templates.merge_playwright_config(existing)).toContain(CUSTOM_PREVIEW_PORT)
	})

	it('preserves custom DEV_PORT from new self-contained format', () => {
		const existing = `const DEV_PORT = 3000\nconst PREVIEW_PORT = 4173`

		expect(init_logic_templates.merge_playwright_config(existing)).toContain(CUSTOM_DEV_PORT)
	})

	it('preserves custom PREVIEW_PORT from new self-contained format', () => {
		const existing = `const DEV_PORT = 5173\nconst PREVIEW_PORT = 8080`

		expect(init_logic_templates.merge_playwright_config(existing)).toContain(CUSTOM_PREVIEW_PORT)
	})

	it('falls back to default dev_port when missing', () => {
		const existing = `export default create_playwright_config({ preview_port: 4173 })`

		expect(init_logic_templates.merge_playwright_config(existing)).toContain(DEFAULT_DEV_PORT_LINE)
	})

	it('falls back to default preview_port when missing', () => {
		const existing = `export default create_playwright_config({ dev_port: 5173 })`

		expect(init_logic_templates.merge_playwright_config(existing)).toContain(
			DEFAULT_PREVIEW_PORT_LINE,
		)
	})

	it('returns idempotent result for default config', () => {
		expect(init_logic_templates.merge_playwright_config(DEFAULT_PLAYWRIGHT_CONFIG)).toBe(
			DEFAULT_PLAYWRIGHT_CONFIG,
		)
	})
})

describe('init_logic_templates.generate_vite_config', () => {
	it('contains the rollup-plugin-visualizer reference', () => {
		expect(init_logic_templates.generate_vite_config()).toContain('rollup-plugin-visualizer')
	})
})
