import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { git_animation } from './git-animation'

describe('git_animation constants', () => {
	it('exports ANIMATION_INTERVAL_MS as 100', () => {
		expect(git_animation.ANIMATION_INTERVAL_MS).toBe(100)
	})

	it('exports ICON_DISPLAY_WIDTH as 4', () => {
		expect(git_animation.ICON_DISPLAY_WIDTH).toBe(4)
	})
})

describe('git_animation.create_animation — non-TTY', () => {
	beforeEach(() => {
		Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true })
	})

	afterEach(() => {
		vi.restoreAllMocks()
		Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true })
	})

	it('returns controller with no-op stop', () => {
		const controller = git_animation.create_animation('loading')

		expect(() => {
			controller.stop('done')
		}).not.toThrow()
	})

	it('returns controller with no-op pause', () => {
		const controller = git_animation.create_animation('loading')

		expect(() => {
			controller.pause()
		}).not.toThrow()
	})
})
