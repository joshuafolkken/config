import { describe, expect, it } from 'vitest'
import { init_logic } from './init-logic'

const FIX_GH_PACKAGES_CMD = 'tsx node_modules/@joshuafolkken/kit/scripts/fix-gh-packages.ts'
const FIX_GH_PACKAGES_MARKER = 'fix-gh-packages'
const LEFTHOOK_INSTALL = 'lefthook install'
const POSTINSTALL = 'postinstall'
const VANILLA = 'vanilla'

describe('get_suggested_scripts postinstall value', () => {
	it('includes fix-gh-packages command in postinstall', () => {
		const result = init_logic.get_suggested_scripts(VANILLA)

		expect(result[POSTINSTALL]).toContain(FIX_GH_PACKAGES_MARKER)
	})

	it('includes lefthook install in postinstall', () => {
		const result = init_logic.get_suggested_scripts(VANILLA)

		expect(result[POSTINSTALL]).toContain(LEFTHOOK_INSTALL)
	})
})

describe('merge_postinstall_fix_cmd', () => {
	it('appends fix cmd to existing postinstall that lacks it', () => {
		const content = JSON.stringify({ scripts: { [POSTINSTALL]: LEFTHOOK_INSTALL } })
		const result = JSON.parse(init_logic.merge_postinstall_fix_cmd(content)) as {
			scripts: Record<string, string>
		}

		expect(result.scripts[POSTINSTALL]).toContain(FIX_GH_PACKAGES_MARKER)
	})

	it('returns content unchanged when fix cmd already present', () => {
		const content = JSON.stringify({
			scripts: { [POSTINSTALL]: `lefthook install && ${FIX_GH_PACKAGES_CMD}` },
		})

		expect(init_logic.merge_postinstall_fix_cmd(content)).toBe(content)
	})

	it('returns content unchanged when no postinstall script exists', () => {
		const content = JSON.stringify({ scripts: {} })

		expect(init_logic.merge_postinstall_fix_cmd(content)).toBe(content)
	})
})
