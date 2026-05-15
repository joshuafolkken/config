import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execute_review, type ReviewDependencies, type ReviewInput } from './git-pr-review'

const BRANCH = 'feature/test'
const RUBRIC_TEXT = '## Rubric body'
const PR_URL = 'https://github.com/owner/repo/pull/1'
const ISSUE_URL = 'https://github.com/owner/repo/issues/1'

const CONTEXT = {
	repo_name: 'repo',
	issue_title: 'Test issue',
	issue_url: ISSUE_URL,
	pr_url: PR_URL,
}

const BUG_RISKS_HEADING = '### Bug risks & logic errors'
const SUMMARY_HEADING = '### Summary'

const CLEAN_REVIEW = [
	BUG_RISKS_HEADING,
	'',
	'No issues — traced X.',
	'',
	SUMMARY_HEADING,
	'',
	'0 high / 0 medium / 0 low — go.',
].join('\n')

const HIGH_REVIEW = [
	BUG_RISKS_HEADING,
	'',
	'- `src/foo.ts:10` (high) — missing null guard — add `?? 0`',
	'',
	SUMMARY_HEADING,
	'',
	'1 high / 0 medium / 0 low — no-go.',
].join('\n')

const LOW_ONLY_REVIEW = [
	'### Bug risks',
	'- `src/foo.ts:10` (low) — minor naming nit',
	'',
	SUMMARY_HEADING,
	'0 high / 0 medium / 1 low — go.',
].join('\n')

const SAMPLE_DIFF = `diff --git a/foo.ts b/foo.ts
+ const x = 1
- const y = 2`

function make_runner_result(stdout: string): {
	stdout: string
	stderr: string
	exit_code: number
} {
	return { stdout, stderr: '', exit_code: 0 }
}

function make_runner(stdout: string): ReviewDependencies['runner'] {
	return vi.fn().mockResolvedValue(make_runner_result(stdout))
}

function make_dependencies(overrides: Partial<ReviewDependencies> = {}): ReviewDependencies {
	return {
		runner: make_runner(CLEAN_REVIEW),
		diff_fetcher: vi.fn().mockResolvedValue(SAMPLE_DIFF),
		pr_commenter: vi.fn().mockResolvedValue(''),
		rubric_loader: vi.fn().mockReturnValue(RUBRIC_TEXT),
		is_claude_available: vi.fn().mockReturnValue(true),
		...overrides,
	}
}

function make_input(overrides: Partial<ReviewInput> = {}): ReviewInput {
	return {
		branch_name: BRANCH,
		ignore_reason: undefined,
		context: CONTEXT,
		...overrides,
	}
}

vi.mock('./git-gh-command', () => ({
	git_gh_command: {
		pr_comment: vi.fn(),
		pr_diff: vi.fn(),
	},
}))

vi.mock('./telegram-notify', () => ({
	telegram_notify: { send: vi.fn() },
}))

const { telegram_notify } = await import('./telegram-notify')

describe('execute_review — clean review path', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('returns without throwing when no findings', async () => {
		const dependencies = make_dependencies()

		await expect(execute_review(dependencies, make_input())).resolves.toBeUndefined()
	})

	it('does not call pr_commenter when no findings', async () => {
		const dependencies = make_dependencies()

		await execute_review(dependencies, make_input())

		expect(dependencies.pr_commenter).not.toHaveBeenCalled()
	})

	it('does not call pr_commenter when only low findings exist', async () => {
		const dependencies = make_dependencies({ runner: make_runner(LOW_ONLY_REVIEW) })

		await execute_review(dependencies, make_input())

		expect(dependencies.pr_commenter).not.toHaveBeenCalled()
	})
})

describe('execute_review — blocker path: error mode', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('throws when high findings exist and no ignore_reason is given', async () => {
		const dependencies = make_dependencies({ runner: make_runner(HIGH_REVIEW) })

		await expect(execute_review(dependencies, make_input())).rejects.toThrow(
			'Review found blockers',
		)
	})

	it('sends a confirmation Telegram notification when throwing', async () => {
		const dependencies = make_dependencies({ runner: make_runner(HIGH_REVIEW) })
		const send_mock = vi.mocked(telegram_notify.send)

		await expect(execute_review(dependencies, make_input())).rejects.toThrow()

		expect(send_mock.mock.calls[0]?.[0]?.task_type).toBe('confirmation')
	})
})

describe('execute_review — blocker path: ignore_reason mode', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('posts ignore-reason comment when ignore_reason is provided', async () => {
		const dependencies = make_dependencies({ runner: make_runner(HIGH_REVIEW) })

		await execute_review(dependencies, make_input({ ignore_reason: 'Tracked separately in #999' }))

		expect(dependencies.pr_commenter).toHaveBeenCalledWith(
			BRANCH,
			expect.stringContaining('Tracked separately'),
		)
	})

	it('does not throw when ignore_reason is provided', async () => {
		const dependencies = make_dependencies({ runner: make_runner(HIGH_REVIEW) })

		await expect(
			execute_review(dependencies, make_input({ ignore_reason: 'ok' })),
		).resolves.toBeUndefined()
	})
})

describe('execute_review — empty diff', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('skips the runner when diff is empty', async () => {
		const dependencies = make_dependencies({ diff_fetcher: vi.fn().mockResolvedValue('') })

		await execute_review(dependencies, make_input())

		expect(dependencies.runner).not.toHaveBeenCalled()
	})

	it('skips the runner when diff is whitespace only', async () => {
		const dependencies = make_dependencies({
			diff_fetcher: vi.fn().mockResolvedValue('   \n\t '),
		})

		await execute_review(dependencies, make_input())

		expect(dependencies.runner).not.toHaveBeenCalled()
	})
})

describe('execute_review — runner failure', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('throws when runner exits non-zero', async () => {
		const dependencies = make_dependencies({
			runner: vi.fn().mockResolvedValue({ stdout: '', stderr: 'auth failed', exit_code: 1 }),
		})

		await expect(execute_review(dependencies, make_input())).rejects.toThrow('exit 1')
	})
})
