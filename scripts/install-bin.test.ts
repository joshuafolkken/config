import { describe, expect, it, vi } from 'vitest'

const mkdir_mock = vi.hoisted(() => vi.fn())
const write_file_mock = vi.hoisted(() => vi.fn())
const chmod_mock = vi.hoisted(() => vi.fn())

vi.mock('node:fs', () => ({
	chmodSync: chmod_mock,
	mkdirSync: mkdir_mock,
	writeFileSync: write_file_mock,
}))
vi.mock('node:os', () => ({ default: { homedir: vi.fn().mockReturnValue('/home/user') } }))
vi.mock('node:path', () => ({
	default: {
		join: (...parts: Array<string>) => parts.join('/'),
		dirname: (path_: string) => path_.split('/').slice(0, -1).join('/'),
	},
}))
vi.mock('./install-bin-logic', () => ({
	install_bin_logic: {
		is_dependency_install: vi.fn().mockReturnValue(false),
		resolve_local_bin_directory: vi.fn().mockReturnValue('/home/user/.local/bin'),
		resolve_bin_path: vi.fn().mockReturnValue('/home/user/.local/bin/josh'),
		resolve_tsx_path: vi.fn().mockReturnValue('/project/node_modules/.bin/tsx'),
		resolve_josh_script_path: vi.fn().mockReturnValue('/pkg/scripts/josh.ts'),
		generate_wrapper_script: vi.fn().mockReturnValue('#!/bin/sh\nexec tsx josh.ts "$@"'),
		format_success: vi.fn().mockReturnValue('✔ josh installed at /home/user/.local/bin/josh'),
		is_bin_directory_on_path: vi.fn().mockReturnValue(true),
		format_path_hint: vi.fn().mockReturnValue(''),
		format_skip: vi.fn().mockReturnValue('Skipping install'),
	},
}))

const { install_josh_bin_section } = await import('./install-bin')

const INSTALL_ERROR_MESSAGE = 'disk full'

describe('install_josh_bin_section — catch block', () => {
	it('logs error message when install_josh_bin throws', () => {
		write_file_mock.mockImplementationOnce(() => {
			throw new Error(INSTALL_ERROR_MESSAGE)
		})
		const warn_spy = vi.spyOn(console, 'warn').mockImplementation(() => {
			/* suppress */
		})

		vi.spyOn(console, 'info').mockImplementation(() => {
			/* suppress */
		})

		install_josh_bin_section()

		expect(warn_spy).toHaveBeenCalledWith(expect.stringContaining(INSTALL_ERROR_MESSAGE))
		vi.restoreAllMocks()
	})

	it('still warns about manual install when error occurs', () => {
		write_file_mock.mockImplementationOnce(() => {
			throw new Error(INSTALL_ERROR_MESSAGE)
		})
		const warn_spy = vi.spyOn(console, 'warn').mockImplementation(() => {
			/* suppress */
		})

		vi.spyOn(console, 'info').mockImplementation(() => {
			/* suppress */
		})

		install_josh_bin_section()

		expect(warn_spy).toHaveBeenCalledWith(expect.stringContaining('josh install'))
		vi.restoreAllMocks()
	})
})
