import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type { Readable, Writable } from 'node:stream'

interface ReviewRunnerResult {
	stdout: string
	stderr: string
	exit_code: number | undefined
}

interface ReviewRunnerInput {
	prompt: string
	command?: string
	command_arguments?: ReadonlyArray<string>
}

const CLAUDE_COMMAND = 'claude'
const CLAUDE_DEFAULT_ARGUMENTS: ReadonlyArray<string> = ['-p', '--output-format', 'text']
const EXIT_OK = 0

function parse_buffer_to_string(chunk: string | Buffer): string {
	return typeof chunk === 'string' ? chunk : chunk.toString('utf8')
}

function create_claude_spawn(
	command: string,
	command_arguments: ReadonlyArray<string>,
): ChildProcessByStdio<Writable, Readable, Readable> {
	return spawn(command, [...command_arguments], {
		stdio: ['pipe', 'pipe', 'pipe'],
		shell: false,
	})
}

async function collect_claude_result(
	child: ChildProcessByStdio<Writable, Readable, Readable>,
): Promise<ReviewRunnerResult> {
	return await new Promise<ReviewRunnerResult>((resolve, reject) => {
		let stdout = ''
		let stderr = ''

		child.stdout.on('data', (chunk: string | Buffer) => {
			stdout += parse_buffer_to_string(chunk)
		})
		child.stderr.on('data', (chunk: string | Buffer) => {
			stderr += parse_buffer_to_string(chunk)
		})
		child.on('error', (error) => {
			reject(new Error(error.message, { cause: error }))
		})
		child.on('close', (code) => {
			resolve({ stdout, stderr, exit_code: code ?? undefined })
		})
	})
}

async function run_claude_review(input: ReviewRunnerInput): Promise<ReviewRunnerResult> {
	const command = input.command ?? CLAUDE_COMMAND
	const command_arguments = input.command_arguments ?? CLAUDE_DEFAULT_ARGUMENTS
	const child = create_claude_spawn(command, command_arguments)
	const result_promise = collect_claude_result(child)

	child.stdin.write(input.prompt)
	child.stdin.end()

	return await result_promise
}

function is_runner_ok(result: ReviewRunnerResult): boolean {
	return result.exit_code === EXIT_OK
}

const git_pr_review_runner = {
	run_claude_review,
	is_runner_ok,
	CLAUDE_COMMAND,
	CLAUDE_DEFAULT_ARGUMENTS,
}

export {
	git_pr_review_runner,
	run_claude_review,
	is_runner_ok,
	CLAUDE_COMMAND,
	CLAUDE_DEFAULT_ARGUMENTS,
}
export type { ReviewRunnerResult, ReviewRunnerInput }
