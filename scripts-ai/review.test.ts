import { describe, expect, it, vi } from 'vitest'

const RESOLVED_BRANCH = vi.hoisted(() => 'current-branch')

vi.mock('node:util', () => ({
	parseArgs: vi.fn().mockReturnValue({ values: {}, positionals: [] }),
}))

vi.mock('../scripts/git/git-pr-review', () => ({
	git_pr_review: {
		handle_pre_merge_review: vi.fn<() => Promise<void>>().mockResolvedValue(),
	},
}))

vi.mock('../scripts/git/git-branch', () => ({
	git_branch: { current: vi.fn().mockResolvedValue(RESOLVED_BRANCH) },
}))

vi.mock('../scripts/git/git-error', () => ({
	git_error: { handle: vi.fn() },
}))

const { review_cli } = await import('./review')

describe('resolve_branch_name', () => {
	it('returns the provided branch name trimmed', async () => {
		const result = await review_cli.resolve_branch_name('feature/x')

		expect(result).toBe('feature/x')
	})

	it('trims whitespace from provided branch name', async () => {
		const result = await review_cli.resolve_branch_name('  feature/x  ')

		expect(result).toBe('feature/x')
	})

	it('falls back to git_branch.current() when branch is undefined', async () => {
		// eslint-disable-next-line unicorn/no-useless-undefined -- explicitly testing undefined input
		const result = await review_cli.resolve_branch_name(undefined)

		expect(result).toBe(RESOLVED_BRANCH)
	})

	it('falls back to git_branch.current() when branch is empty string', async () => {
		const result = await review_cli.resolve_branch_name('')

		expect(result).toBe(RESOLVED_BRANCH)
	})
})
