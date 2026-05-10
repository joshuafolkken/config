import { describe, expect, it } from 'vitest'
import { MAINTENANCE_COMMANDS } from './josh-commands-maintenance'

const LATEST_UPDATE_SCRIPT = 'scripts/latest-update.ts'
const LATEST_UPDATE_NOT_DEFINED = 'latest:update command not defined'
const LATEST_NOT_DEFINED = 'latest command not defined'

describe('MAINTENANCE_COMMANDS latest:update', () => {
	it('uses latest-update.ts script instead of pnpm update --latest', () => {
		const cmd = MAINTENANCE_COMMANDS['latest:update']
		if (!cmd) throw new Error(LATEST_UPDATE_NOT_DEFINED)

		expect(cmd.script).toBe(LATEST_UPDATE_SCRIPT)
		expect(cmd.shell).toBeUndefined()
	})
})

describe('MAINTENANCE_COMMANDS latest', () => {
	const { latest: cmd } = MAINTENANCE_COMMANDS

	it('is an alias for latest:update using the same script', () => {
		if (!cmd) throw new Error(LATEST_NOT_DEFINED)

		expect(cmd.script).toBe(LATEST_UPDATE_SCRIPT)
		expect(cmd.shell).toBeUndefined()
	})

	it('latest:corepack command no longer exists', () => {
		expect(MAINTENANCE_COMMANDS['latest:corepack']).toBeUndefined()
	})
})
