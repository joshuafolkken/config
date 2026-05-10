import { describe, expect, it } from 'vitest'
import { init_logic } from './init-logic'

describe('get_development_engines_value', () => {
	it('pins pnpm to the current exact version', () => {
		const result = init_logic.get_development_engines_value()

		expect(result.packageManager.name).toBe('pnpm')
		expect(result.packageManager.version).toBe('11.0.9')
		expect(result.packageManager.onFail).toBe('error')
	})
})
