import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sync } from './sync'

const TEST_DIR = path.join(tmpdir(), 'sync-test')
const SRC_PATH = path.join(TEST_DIR, 'src', 'gitignore')
const GITIGNORE_DEST_NAME = '.gitignore'
const DEST_PATH = path.join(TEST_DIR, 'dest', GITIGNORE_DEST_NAME)

beforeEach(() => {
	mkdirSync(path.join(TEST_DIR, 'src'), { recursive: true })
	mkdirSync(path.join(TEST_DIR, 'dest'), { recursive: true })
})

afterEach(() => {
	rmSync(TEST_DIR, { recursive: true, force: true })
	vi.restoreAllMocks()
})

describe('sync_file_mapping', () => {
	it('copies src to dest when src exists', () => {
		writeFileSync(SRC_PATH, 'node_modules\n')
		sync.sync_file_mapping(SRC_PATH, DEST_PATH)

		expect(existsSync(DEST_PATH)).toBe(true)
		expect(readFileSync(DEST_PATH, 'utf8')).toBe('node_modules\n')
	})

	it('creates dest directory when it does not exist', () => {
		const nested_destination = path.join(TEST_DIR, 'new', 'nested', GITIGNORE_DEST_NAME)

		writeFileSync(SRC_PATH, 'node_modules\n')
		sync.sync_file_mapping(SRC_PATH, nested_destination)

		expect(existsSync(nested_destination)).toBe(true)
	})

	it('warns and does not throw when src does not exist', () => {
		const warn_spy = vi.spyOn(console, 'warn').mockImplementation(() => {
			/* suppress */
		})
		const missing_source = path.join(TEST_DIR, 'src', 'missing')

		expect(() => {
			sync.sync_file_mapping(missing_source, DEST_PATH)
		}).not.toThrow()
		expect(warn_spy).toHaveBeenCalledOnce()
		expect(warn_spy.mock.calls[0]?.[0]).toContain('skipped')
	})

	it('does not create dest file when src does not exist', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {
			/* suppress */
		})
		const missing_source = path.join(TEST_DIR, 'src', 'missing')

		sync.sync_file_mapping(missing_source, DEST_PATH)

		expect(existsSync(DEST_PATH)).toBe(false)
	})
})
