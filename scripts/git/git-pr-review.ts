import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { git_gh_command } from './git-gh-command'
import type { TelegramContext } from './git-pr-ai-review'
import {
	collect_blocker_lines,
	format_finding_summary,
	has_blocker,
	parse_review_markdown,
	type ParsedReview,
} from './git-pr-review-parse'
import { run_claude_review, type ReviewRunnerResult } from './git-pr-review-runner'
import { telegram_notify, type TelegramSendInput } from './telegram-notify'

const RUBRIC_RELATIVE_PATH = 'prompts/review.md'
const PACKAGE_MARKER = 'package.json'
const EXIT_OK = 0
const EMPTY_STRING_LENGTH = 0

function resolve_package_directory(): string {
	let current = path.dirname(fileURLToPath(import.meta.url))
	let parent = path.dirname(current)

	while (current !== parent) {
		if (existsSync(path.join(current, PACKAGE_MARKER))) return current
		current = parent
		parent = path.dirname(current)
	}

	throw new Error(`Unable to locate ${PACKAGE_MARKER} above ${fileURLToPath(import.meta.url)}`)
}

type ReviewRunner = (input: { prompt: string }) => Promise<ReviewRunnerResult>
type DiffFetcher = (branch_name: string) => Promise<string>
type PrCommenter = (branch_name: string, body: string) => Promise<string>

interface ReviewDependencies {
	runner: ReviewRunner
	diff_fetcher: DiffFetcher
	pr_commenter: PrCommenter
	rubric_loader: () => string
	is_claude_available: () => boolean
}

interface ReviewInput {
	branch_name: string
	ignore_reason: string | undefined
	context: TelegramContext
}

function load_rubric(): string {
	return readFileSync(path.join(resolve_package_directory(), RUBRIC_RELATIVE_PATH), 'utf8')
}

function detect_claude_available(): boolean {
	try {
		/* eslint-disable sonarjs/no-os-command-from-path -- which is a well-known CLI utility */
		const result = spawnSync('which', ['claude'], { encoding: 'utf8', shell: false })
		/* eslint-enable sonarjs/no-os-command-from-path */

		return result.status === EXIT_OK && result.stdout.trim().length > EMPTY_STRING_LENGTH
	} catch {
		return false
	}
}

function build_review_prompt(rubric: string, diff: string): string {
	const sections = [
		'You are running a pre-merge code review.',
		'Follow the rubric below exactly. Output only the markdown review report — no preamble, no follow-up commentary.',
		'',
		'## Rubric',
		'',
		rubric,
		'',
		'## Diff (against main)',
		'',
		'```diff',
		diff,
		'```',
	]

	return sections.join('\n')
}

function build_blocker_error(parsed: ParsedReview, markdown: string): string {
	const lines = [
		`Review found blockers: ${format_finding_summary(parsed)}.`,
		'',
		'Blocker findings:',
		...collect_blocker_lines(parsed).map((line) => (line.startsWith('-') ? line : `- ${line}`)),
		'',
		'Full review output:',
		'',
		markdown,
	]

	return lines.join('\n')
}

function build_ignore_comment(reason: string, parsed: ParsedReview): string {
	const lines = [
		'Pre-merge review findings were intentionally left unresolved.',
		`Reason: ${reason.trim()}`,
		'',
		'Findings:',
		...collect_blocker_lines(parsed).map((line) => (line.startsWith('-') ? line : `- ${line}`)),
	]

	return lines.join('\n')
}

function build_confirmation_input(input: {
	context: TelegramContext
	body: string
}): TelegramSendInput {
	return {
		task_type: 'confirmation',
		repo_name: input.context.repo_name,
		issue_title: input.context.issue_title,
		body: input.body,
		issue_url: input.context.issue_url,
		pr_url: input.context.pr_url,
	}
}

async function notify_review_confirmation(input: {
	context: TelegramContext
	body: string
}): Promise<void> {
	await telegram_notify.send(build_confirmation_input(input))
}

function has_ignore_reason(reason: string | undefined): reason is string {
	return reason !== undefined && reason.trim().length > EMPTY_STRING_LENGTH
}

interface BlockerDispatchInput {
	parsed: ParsedReview
	markdown: string
	branch_name: string
	ignore_reason: string | undefined
	context: TelegramContext
	pr_commenter: PrCommenter
}

async function dispatch_blocker(input: BlockerDispatchInput): Promise<void> {
	const error_body = build_blocker_error(input.parsed, input.markdown)

	if (has_ignore_reason(input.ignore_reason)) {
		const ignore_comment = build_ignore_comment(input.ignore_reason, input.parsed)

		await input.pr_commenter(input.branch_name, ignore_comment)

		return
	}

	await notify_review_confirmation({ context: input.context, body: error_body })

	throw new Error(error_body)
}

function print_review_output(markdown: string, parsed: ParsedReview): void {
	console.info('')
	console.info('🧐 Pre-merge review output:')
	console.info('')
	console.info(markdown)
	console.info('')
	console.info(`Review summary: ${format_finding_summary(parsed)}`)
}

function fail_on_runner_error(result: ReviewRunnerResult): void {
	if (result.exit_code === EXIT_OK) return

	throw new Error(
		`Pre-merge review runner failed (exit ${String(result.exit_code)}): ${result.stderr}`,
	)
}

async function run_review_call(
	dependencies: ReviewDependencies,
	diff: string,
): Promise<ReviewRunnerResult> {
	const rubric = dependencies.rubric_loader()
	const prompt = build_review_prompt(rubric, diff)

	return await dependencies.runner({ prompt })
}

async function fetch_diff_or_skip(
	dependencies: ReviewDependencies,
	branch_name: string,
): Promise<string | undefined> {
	const diff = await dependencies.diff_fetcher(branch_name)
	if (diff.trim().length > EMPTY_STRING_LENGTH) return diff

	console.info('⏭  Pre-merge review skipped — diff is empty.')

	return undefined
}

function build_blocker_dispatch_input(
	dependencies: ReviewDependencies,
	input: ReviewInput,
	parsed: ParsedReview,
	markdown: string,
): BlockerDispatchInput {
	return {
		parsed,
		markdown,
		branch_name: input.branch_name,
		ignore_reason: input.ignore_reason,
		context: input.context,
		pr_commenter: dependencies.pr_commenter,
	}
}

async function process_review_result(
	dependencies: ReviewDependencies,
	input: ReviewInput,
	result: ReviewRunnerResult,
): Promise<void> {
	fail_on_runner_error(result)
	const parsed = parse_review_markdown(result.stdout)

	print_review_output(result.stdout, parsed)
	if (!has_blocker(parsed)) return

	await dispatch_blocker(build_blocker_dispatch_input(dependencies, input, parsed, result.stdout))
}

async function execute_review(dependencies: ReviewDependencies, input: ReviewInput): Promise<void> {
	if (!dependencies.is_claude_available()) {
		console.warn('⚠️  Pre-merge review skipped — `claude` CLI is not available on PATH.')

		return
	}

	const diff = await fetch_diff_or_skip(dependencies, input.branch_name)
	if (diff === undefined) return

	const result = await run_review_call(dependencies, diff)

	await process_review_result(dependencies, input, result)
}

const DEFAULT_DEPENDENCIES: ReviewDependencies = {
	runner: run_claude_review,
	diff_fetcher: git_gh_command.pr_diff,
	pr_commenter: git_gh_command.pr_comment,
	rubric_loader: load_rubric,
	is_claude_available: detect_claude_available,
}

async function handle_pre_merge_review(input: ReviewInput): Promise<void> {
	await execute_review(DEFAULT_DEPENDENCIES, input)
}

const git_pr_review = {
	handle_pre_merge_review,
	execute_review,
	build_review_prompt,
	build_blocker_error,
	build_ignore_comment,
}

export {
	git_pr_review,
	execute_review,
	build_review_prompt,
	build_blocker_error,
	build_ignore_comment,
	has_ignore_reason,
}
export type { ReviewDependencies, ReviewInput, ReviewRunner, DiffFetcher, PrCommenter }
