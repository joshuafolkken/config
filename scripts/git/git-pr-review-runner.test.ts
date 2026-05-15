import { describe, expect, it } from 'vitest'
import {
	CLAUDE_COMMAND,
	CLAUDE_DEFAULT_ARGUMENTS,
	is_runner_ok,
	run_claude_review,
} from './git-pr-review-runner'

const EMPTY_RESULT_FIXTURE = { stdout: '', stderr: '' } as const
const PASSTHROUGH_COMMAND = 'cat'
const PASSTHROUGH_PROMPT = 'hello review'

describe('CLAUDE_COMMAND', () => {
	it('is the literal claude binary name', () => {
		expect(CLAUDE_COMMAND).toBe('claude')
	})
})

describe('CLAUDE_DEFAULT_ARGUMENTS', () => {
	it('uses print mode for non-interactive invocation', () => {
		expect(CLAUDE_DEFAULT_ARGUMENTS).toContain('-p')
	})

	it('requests text output format', () => {
		expect(CLAUDE_DEFAULT_ARGUMENTS).toContain('text')
	})
})

describe('is_runner_ok', () => {
	it('returns true for exit_code 0', () => {
		expect(is_runner_ok({ ...EMPTY_RESULT_FIXTURE, exit_code: 0 })).toBe(true)
	})

	it('returns false for non-zero exit_code', () => {
		expect(is_runner_ok({ ...EMPTY_RESULT_FIXTURE, exit_code: 1 })).toBe(false)
	})

	it('returns false for undefined exit_code (signal kill)', () => {
		expect(is_runner_ok({ ...EMPTY_RESULT_FIXTURE, exit_code: undefined })).toBe(false)
	})
})

describe('run_claude_review — error path', () => {
	it('rejects when the command binary does not exist', async () => {
		const promise = run_claude_review({
			prompt: 'test',
			command: '/nonexistent/binary/that/should/not/exist',
			command_arguments: [],
		})

		await expect(promise).rejects.toThrow()
	})

	it('echoes prompt to stdout when using a passthrough command', async () => {
		const result = await run_claude_review({
			prompt: PASSTHROUGH_PROMPT,
			command: PASSTHROUGH_COMMAND,
			command_arguments: [],
		})

		expect(result.exit_code).toBe(0)
		expect(result.stdout).toContain(PASSTHROUGH_PROMPT)
	})
})
