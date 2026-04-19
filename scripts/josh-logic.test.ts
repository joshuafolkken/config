import { describe, expect, it } from 'vitest'
import { COMMAND_MAP, josh_logic } from './josh-logic'

const EXPECTED_COMMANDS = [
	'init',
	'sync',
	'git',
	'git-followup',
	'telegram-test',
	'prep',
	'issue-prep',
	'bump-version',
	'overrides-check',
	'security-audit',
	'prevent-main-commit',
	'check-commit-message',
]

describe('COMMAND_MAP', () => {
	it('contains all expected commands', () => {
		for (const cmd of EXPECTED_COMMANDS) {
			expect(COMMAND_MAP).toHaveProperty(cmd)
		}
	})

	it('each entry has a script path and description', () => {
		for (const entry of Object.values(COMMAND_MAP)) {
			expect(entry.script).toBeTruthy()
			expect(entry.description).toBeTruthy()
		}
	})
})

describe('josh_logic.format_help', () => {
	it('includes the toolkit header with author name', () => {
		expect(josh_logic.format_help()).toContain('Joshua Folkken')
	})

	it('includes all command names', () => {
		const help = josh_logic.format_help()

		for (const cmd of EXPECTED_COMMANDS) {
			expect(help).toContain(cmd)
		}
	})

	it('includes usage line', () => {
		expect(josh_logic.format_help()).toContain('Usage: josh <command>')
	})
})

describe('josh_logic.run_command', () => {
	it('returns -1 for an unknown command', () => {
		expect(josh_logic.run_command('not-a-real-command', [])).toBe(-1)
	})
})
