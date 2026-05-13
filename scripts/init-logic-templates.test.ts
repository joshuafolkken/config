import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { init_logic_templates } from './init-logic-templates'
import { PACKAGE_DIR } from './init-paths'

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

const PLAYWRIGHT_CONFIG = readFileSync(path.join(PACKAGE_DIR, 'playwright.config.ts'), 'utf8')

describe('init_logic_templates.generate_playwright_config', () => {
	it('contains defineConfig and devices imports', () => {
		expect(init_logic_templates.generate_playwright_config()).toContain('defineConfig, devices')
	})

	it('returns the playwright.config.ts template file content', () => {
		expect(init_logic_templates.generate_playwright_config()).toBe(PLAYWRIGHT_CONFIG)
	})
})

describe('init_logic_templates.generate_vite_config', () => {
	it('contains the rollup-plugin-visualizer reference', () => {
		expect(init_logic_templates.generate_vite_config()).toContain('rollup-plugin-visualizer')
	})
})

const CI_YML_CONTENT = readFileSync(
	path.join(PACKAGE_DIR, 'templates', 'workflows', 'ci.yml'),
	'utf8',
)

describe('ci.yml template content', () => {
	it('does not have a separate build step before E2E (build runs inside webServer)', () => {
		expect(CI_YML_CONTENT).not.toContain('E2E_CLEANUP_ENABLED')
	})

	it('does not have a dedicated Build application step in the e2e job', () => {
		expect(CI_YML_CONTENT).not.toContain('Build application')
	})

	it('includes notify-auto-tag job that dispatches ci-passed-on-main event', () => {
		expect(CI_YML_CONTENT).toContain('notify-auto-tag')
		expect(CI_YML_CONTENT).toContain('ci-passed-on-main')
	})

	it('includes playwright-image job that resolves the image dynamically', () => {
		expect(CI_YML_CONTENT).toContain('playwright-image:')
		expect(CI_YML_CONTENT).toContain('steps.resolve.outputs.image')
	})

	it('has no hardcoded playwright docker image tag', () => {
		expect(CI_YML_CONTENT).not.toMatch(/mcr\.microsoft\.com\/playwright:v\d+\.\d+\.\d+-noble/u)
	})

	it('checks and e2e jobs reference the dynamic playwright image output', () => {
		expect(CI_YML_CONTENT).toContain('needs.playwright-image.outputs.image')
	})
})

const SVELTEKIT_YML_CONTENT = readFileSync(
	path.join(PACKAGE_DIR, 'lefthook', 'sveltekit.yml'),
	'utf8',
)

describe('lefthook sveltekit.yml content', () => {
	it('sets CI env var in pre-push to trigger playwright CI path', () => {
		expect(SVELTEKIT_YML_CONTENT).toContain("CI: '1'")
	})
})
