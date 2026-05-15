import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const PACKAGE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const RUNTIME_CI_YML = path.join(PACKAGE_ROOT, '.github/workflows/ci.yml')
const TEMPLATE_CI_YML = path.join(PACKAGE_ROOT, 'templates/workflows/ci.yml')
const USES_KEY = 'uses:'

function extract_uses(file_path: string): Array<string> {
	const uses: Array<string> = []

	for (const line of readFileSync(file_path, 'utf8').split('\n')) {
		const index = line.indexOf(USES_KEY)

		if (index !== -1 && line.slice(0, index).trim() === '') {
			uses.push(line.slice(index + USES_KEY.length).trim())
		}
	}

	return uses.toSorted((left, right) => left.localeCompare(right))
}

describe('ci.yml SHA parity (templates/workflows/ci.yml vs .github/workflows/ci.yml)', () => {
	it('every "uses:" SHA pin in the template matches the runtime workflow', () => {
		expect(extract_uses(TEMPLATE_CI_YML)).toEqual(extract_uses(RUNTIME_CI_YML))
	})
})
