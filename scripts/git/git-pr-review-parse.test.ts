import { describe, expect, it } from 'vitest'
import {
	collect_blocker_lines,
	format_finding_summary,
	has_blocker,
	parse_review_markdown,
} from './git-pr-review-parse'

const HIGH_FINDING = '- `src/foo.ts:42` (high) — null pointer dereference — add guard'
const MEDIUM_FINDING = '- `e2e/foo.test.ts:15` (medium) — assertion is too loose — rewrite'
const LOW_FINDING = '- `src/bar.ts:8` (low) — variable name is unclear — rename'
const NO_FINDING_LINE = 'No issues — verified snake_case, no arrow functions.'

describe('parse_review_markdown — empty inputs', () => {
	it('returns is_empty true for empty input', () => {
		const result = parse_review_markdown('')

		expect(result.is_empty).toBe(true)
		expect(result.findings).toHaveLength(0)
	})

	it('returns is_empty true for whitespace-only input', () => {
		expect(parse_review_markdown('   \n\t  ').is_empty).toBe(true)
	})
})

describe('parse_review_markdown — severity counting', () => {
	it('counts a single high finding', () => {
		const result = parse_review_markdown(HIGH_FINDING)

		expect(result.high_count).toBe(1)
		expect(result.medium_count).toBe(0)
		expect(result.findings[0]?.severity).toBe('high')
	})

	it('counts mixed severities across multiple lines', () => {
		const markdown = [HIGH_FINDING, MEDIUM_FINDING, MEDIUM_FINDING, LOW_FINDING].join('\n')
		const result = parse_review_markdown(markdown)

		expect(result.high_count).toBe(1)
		expect(result.medium_count).toBe(2)
		expect(result.low_count).toBe(1)
	})

	it('is case-insensitive for severity tags', () => {
		const markdown = '- `src/foo.ts:1` (High) — capitalization variant'

		expect(parse_review_markdown(markdown).high_count).toBe(1)
	})

	it('counts a finding indented under a nested list', () => {
		const markdown = '   - `src/foo.ts:1` (high) — indented finding'

		expect(parse_review_markdown(markdown).high_count).toBe(1)
	})
})

describe('parse_review_markdown — non-finding lines', () => {
	it('ignores lines without a severity tag', () => {
		const markdown = [NO_FINDING_LINE, '### Some heading', LOW_FINDING].join('\n')
		const result = parse_review_markdown(markdown)

		expect(result.findings).toHaveLength(1)
		expect(result.low_count).toBe(1)
	})

	it('does not count words that are not severity tags (e.g. "(highly)")', () => {
		const result = parse_review_markdown('This change is (highly) recommended')

		expect(result.high_count).toBe(0)
		expect(result.findings).toHaveLength(0)
	})

	it('does not count severity tags in prose (no file-path bullet prefix)', () => {
		const markdown = 'The pattern matches `(high)` anywhere on any line — see confidence floor.'

		expect(parse_review_markdown(markdown).high_count).toBe(0)
	})

	it('does not count severity tags inside summary paragraphs', () => {
		const markdown = [
			'### Summary',
			'',
			'- 0 high / 1 medium / 0 low',
			'Found 1 (medium) finding in the parser.',
		].join('\n')

		expect(parse_review_markdown(markdown).medium_count).toBe(0)
	})

	it('does not count severity tags in plain bullet without file-path backticks', () => {
		const markdown = '- The regex matches (high) without requiring a file citation.'

		expect(parse_review_markdown(markdown).high_count).toBe(0)
	})
})

describe('has_blocker', () => {
	it('returns true when at least one high finding exists', () => {
		expect(has_blocker(parse_review_markdown(HIGH_FINDING))).toBe(true)
	})

	it('returns true when at least one medium finding exists', () => {
		expect(has_blocker(parse_review_markdown(MEDIUM_FINDING))).toBe(true)
	})

	it('returns false when only low findings exist', () => {
		expect(has_blocker(parse_review_markdown(LOW_FINDING))).toBe(false)
	})

	it('returns false when no findings exist', () => {
		expect(has_blocker(parse_review_markdown(NO_FINDING_LINE))).toBe(false)
	})
})

describe('format_finding_summary', () => {
	it('reports 0 findings when none present', () => {
		expect(format_finding_summary(parse_review_markdown(''))).toBe('0 findings')
	})

	it('formats mixed severities', () => {
		const markdown = [HIGH_FINDING, MEDIUM_FINDING, LOW_FINDING].join('\n')

		expect(format_finding_summary(parse_review_markdown(markdown))).toBe('1 high, 1 medium, 1 low')
	})

	it('omits severities with zero count', () => {
		expect(format_finding_summary(parse_review_markdown(LOW_FINDING))).toBe('1 low')
	})
})

describe('collect_blocker_lines', () => {
	it('returns high and medium lines only', () => {
		const markdown = [HIGH_FINDING, MEDIUM_FINDING, LOW_FINDING].join('\n')
		const result = collect_blocker_lines(parse_review_markdown(markdown))

		expect(result).toHaveLength(2)
		expect(result[0]).toContain('(high)')
		expect(result[1]).toContain('(medium)')
	})

	it('returns empty array when only low findings exist', () => {
		const result = collect_blocker_lines(parse_review_markdown(LOW_FINDING))

		expect(result).toHaveLength(0)
	})
})
