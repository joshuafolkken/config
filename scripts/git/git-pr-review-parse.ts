type Severity = 'high' | 'medium' | 'low'

interface ParsedFinding {
	severity: Severity
	line: string
}

interface ParsedReview {
	findings: ReadonlyArray<ParsedFinding>
	high_count: number
	medium_count: number
	low_count: number
	is_empty: boolean
}

const FINDING_LINE_PATTERN = /\((high|medium|low)\)/iu
const EMPTY_COUNT = 0

function parse_severity(raw: string): Severity {
	const lower = raw.toLowerCase()
	if (lower === 'high') return 'high'
	if (lower === 'medium') return 'medium'

	return 'low'
}

function extract_finding(line: string): ParsedFinding | undefined {
	const match = FINDING_LINE_PATTERN.exec(line)
	if (match?.[1] === undefined) return undefined

	return { severity: parse_severity(match[1]), line: line.trim() }
}

function count_by_severity(findings: ReadonlyArray<ParsedFinding>, severity: Severity): number {
	return findings.filter((finding) => finding.severity === severity).length
}

function parse_review_markdown(markdown: string): ParsedReview {
	const lines = markdown.split('\n')
	const findings: Array<ParsedFinding> = []

	for (const line of lines) {
		const finding = extract_finding(line)
		if (finding !== undefined) findings.push(finding)
	}

	return {
		findings,
		high_count: count_by_severity(findings, 'high'),
		medium_count: count_by_severity(findings, 'medium'),
		low_count: count_by_severity(findings, 'low'),
		is_empty: markdown.trim().length === EMPTY_COUNT,
	}
}

function has_blocker(parsed: ParsedReview): boolean {
	return parsed.high_count + parsed.medium_count > EMPTY_COUNT
}

function format_finding_summary(parsed: ParsedReview): string {
	const parts: Array<string> = []
	if (parsed.high_count > EMPTY_COUNT) parts.push(`${String(parsed.high_count)} high`)
	if (parsed.medium_count > EMPTY_COUNT) parts.push(`${String(parsed.medium_count)} medium`)
	if (parsed.low_count > EMPTY_COUNT) parts.push(`${String(parsed.low_count)} low`)
	if (parts.length === EMPTY_COUNT) return '0 findings'

	return parts.join(', ')
}

function collect_blocker_lines(parsed: ParsedReview): ReadonlyArray<string> {
	return parsed.findings
		.filter((finding) => finding.severity === 'high' || finding.severity === 'medium')
		.map((finding) => finding.line)
}

const git_pr_review_parse = {
	parse_review_markdown,
	has_blocker,
	format_finding_summary,
	collect_blocker_lines,
}

export {
	git_pr_review_parse,
	parse_review_markdown,
	has_blocker,
	format_finding_summary,
	collect_blocker_lines,
}
export type { ParsedReview, ParsedFinding, Severity }
