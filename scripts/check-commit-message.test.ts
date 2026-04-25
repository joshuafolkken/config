import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./git/git-command', () => ({
	git_command: { branch: vi.fn() },
}))

vi.mock('node:fs', () => ({
	readFileSync: vi.fn(),
}))

const { git_command } = await import('./git/git-command')
const { readFileSync: read_file_sync } = await import('node:fs')

const mocked_branch = vi.mocked(git_command.branch)
const mocked_read = vi.mocked(read_file_sync)

mocked_branch.mockResolvedValue('main')

const { check_commit_message, extract_issue_number } = await import('./check-commit-message')

beforeEach(() => {
	vi.clearAllMocks()
})

describe('check-commit-message — side-effect-free import', () => {
	it('does not call console.info or process.exit on import', () => {
		const console_spy = vi.spyOn(console, 'info').mockImplementation(vi.fn())
		const exit_spy = vi.spyOn(process, 'exit').mockImplementation(vi.fn() as never)

		expect(console_spy).not.toHaveBeenCalled()
		expect(exit_spy).not.toHaveBeenCalled()
	})
})

describe('extract_issue_number', () => {
	it('returns the issue number from a valid branch name', () => {
		expect(extract_issue_number('123-fix-bug')).toBe('123')
	})

	it('returns undefined for main branch', () => {
		expect(extract_issue_number('main')).toBeUndefined()
	})

	it('returns undefined for a branch without a leading number', () => {
		expect(extract_issue_number('fix-bug')).toBeUndefined()
	})
})

describe('check_commit_message — branch without issue number', () => {
	it('returns success when branch has no issue number', async () => {
		mocked_branch.mockResolvedValue('main')

		const result = await check_commit_message()

		expect(result.success).toBe(true)
		expect(result.message).toContain('no issue number required')
	})
})

describe('check_commit_message — branch with issue number', () => {
	const ISSUE_BRANCH = '42-fix-bug'

	it('returns success when commit message contains the issue number', async () => {
		mocked_branch.mockResolvedValue(ISSUE_BRANCH)
		mocked_read.mockReturnValue('Fix the bug #42')

		const result = await check_commit_message()

		expect(result.success).toBe(true)
		expect(result.message).toContain('#42')
	})

	it('returns failure when commit message is missing the issue number', async () => {
		mocked_branch.mockResolvedValue(ISSUE_BRANCH)
		mocked_read.mockReturnValue('Fix the bug')

		const result = await check_commit_message()

		expect(result.success).toBe(false)
		expect(result.message).toContain('#42')
	})
})
