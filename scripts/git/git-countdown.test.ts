import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('git_countdown.wait_for_seconds — no countdown message', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('resolves after the specified number of seconds', async () => {
		const { git_countdown } = await import('./git-countdown')
		const promise = git_countdown.wait_for_seconds(3)

		vi.advanceTimersByTime(3000)

		await expect(promise).resolves.toBeUndefined()
	})
})

describe('git_countdown.wait_for_seconds — non-TTY with message', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true })
	})

	afterEach(() => {
		vi.useRealTimers()
		Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true })
	})

	it('resolves without writing to stdout when not TTY', async () => {
		const write_spy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
		const { git_countdown } = await import('./git-countdown')
		const promise = git_countdown.wait_for_seconds(1, 'Waiting...')

		vi.advanceTimersByTime(1000)

		await expect(promise).resolves.toBeUndefined()
		expect(write_spy).not.toHaveBeenCalled()
	})
})
