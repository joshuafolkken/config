import { describe, expect, it } from 'vitest'
import { VERSIONING_COMMANDS } from './josh-commands-versioning'

const VERSION_UPGRADE_NOT_DEFINED = 'version:upgrade command not defined'
const FIX_GH_PACKAGES_SCRIPT = 'fix-gh-packages.ts'

describe('VERSIONING_COMMANDS version:upgrade', () => {
	it('runs fix-gh-packages after pnpm add', () => {
		const cmd = VERSIONING_COMMANDS['version:upgrade']
		if (!cmd) throw new Error(VERSION_UPGRADE_NOT_DEFINED)

		expect(cmd.shell?.join(' ') ?? '').toContain(FIX_GH_PACKAGES_SCRIPT)
	})

	it('uses pnpm add -D to upgrade the package', () => {
		const cmd = VERSIONING_COMMANDS['version:upgrade']
		if (!cmd) throw new Error(VERSION_UPGRADE_NOT_DEFINED)

		expect(cmd.shell?.join(' ') ?? '').toContain('pnpm add -D @joshuafolkken/kit@')
	})
})
