import { describe, expect, it, vi } from 'vitest'

const exec_mock = vi.hoisted(() => {
	const state = { should_fail: false as boolean, stdout: '' }

	async function mock_exec_async(_command: string): Promise<{ stdout: string; stderr: string }> {
		if (state.should_fail) throw new Error('Command failed')

		return await Promise.resolve({ stdout: state.stdout, stderr: '' })
	}

	return { state, mock_exec_async }
})

vi.mock('node:util', () => ({
	promisify: () => exec_mock.mock_exec_async,
}))

const PACKAGE_JSON = 'package.json'
const DIFF_OUTPUT = 'diff output'
const SUCCEEDS_TEST = 'returns a string when git succeeds'
const PROPAGATES_ERRORS_TEST = 'propagates errors instead of returning empty string'

describe('git_command.diff_cached', () => {
	it(SUCCEEDS_TEST, async () => {
		exec_mock.state.should_fail = false
		exec_mock.state.stdout = DIFF_OUTPUT

		const { git_command } = await import('./git-command')
		const result = await git_command.diff_cached(PACKAGE_JSON)

		expect(result).toStrictEqual(expect.any(String))
	})

	it(PROPAGATES_ERRORS_TEST, async () => {
		exec_mock.state.should_fail = true

		const { git_command } = await import('./git-command')

		await expect(git_command.diff_cached(PACKAGE_JSON)).rejects.toThrow()
	})
})

describe('git_command.diff_main', () => {
	it(SUCCEEDS_TEST, async () => {
		exec_mock.state.should_fail = false
		exec_mock.state.stdout = DIFF_OUTPUT

		const { git_command } = await import('./git-command')
		const result = await git_command.diff_main(PACKAGE_JSON)

		expect(result).toStrictEqual(expect.any(String))
	})

	it(PROPAGATES_ERRORS_TEST, async () => {
		exec_mock.state.should_fail = true

		const { git_command } = await import('./git-command')

		await expect(git_command.diff_main(PACKAGE_JSON)).rejects.toThrow()
	})
})
