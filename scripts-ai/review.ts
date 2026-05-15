#!/usr/bin/env tsx
import { parseArgs } from 'node:util'
import { git_branch } from '../scripts/git/git-branch'
import { git_error } from '../scripts/git/git-error'
import { git_pr_review } from '../scripts/git/git-pr-review'

interface CliArguments {
	values: {
		branch?: string
		help?: boolean
	}
}

function display_help(): void {
	console.info(`
🧐 Pre-merge Review (claude -p)

Runs prompts/review.md against the current PR diff via the Claude CLI.
Prints the review markdown to stdout. Exits non-zero when high or medium
findings are present.

Usage:
  jf-review [options]

Options:
  --branch     Target branch name (default: current branch)
  -h, --help   Show this help
	`)
}

function parse_cli_arguments(): CliArguments {
	return parseArgs({
		options: {
			branch: { type: 'string' },
			help: { type: 'boolean', short: 'h' },
		},
		allowPositionals: true,
	})
}

async function resolve_branch_name(raw_branch: string | undefined): Promise<string> {
	if (raw_branch !== undefined && raw_branch.trim().length > 0) return raw_branch.trim()

	return await git_branch.current()
}

async function main(): Promise<void> {
	const cli = parse_cli_arguments()

	if (cli.values.help === true) {
		display_help()

		return
	}

	const branch_name = await resolve_branch_name(cli.values.branch)

	await git_pr_review.handle_pre_merge_review({
		branch_name,
		ignore_reason: undefined,
		context: {
			repo_name: undefined,
			issue_title: undefined,
			issue_url: undefined,
			pr_url: undefined,
		},
	})
}

try {
	await main()
} catch (error) {
	git_error.handle(error)
}

const review_cli = {
	resolve_branch_name,
}

export { review_cli }
