#!/usr/bin/env tsx
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { init_logic } from './init-logic'

const PACKAGE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT_ROOT = process.cwd()

function sync_file(filename: string): void {
	const destination_path = path.join(PROJECT_ROOT, filename)

	mkdirSync(path.dirname(destination_path), { recursive: true })
	cpSync(path.join(PACKAGE_DIR, filename), destination_path)
	console.info(`  ✔ synced    ${filename}`)
}

function sync_file_mapping(source_path: string, destination_path: string): void {
	if (!existsSync(source_path)) {
		console.warn(`  ⚠ skipped   ${path.basename(destination_path)} (not found in package)`)

		return
	}

	mkdirSync(path.dirname(destination_path), { recursive: true })
	cpSync(source_path, destination_path)
	console.info(`  ✔ synced    ${path.basename(destination_path)}`)
}

function sync_directory(directory_name: string): void {
	cpSync(path.join(PACKAGE_DIR, directory_name), path.join(PROJECT_ROOT, directory_name), {
		recursive: true,
	})
	console.info(`  ✔ synced    ${directory_name}/`)
}

function main(): void {
	console.info('\n🔄 Syncing @joshuafolkken/config AI files\n')
	console.info('AI files:')

	for (const filename of init_logic.get_ai_copy_files()) {
		sync_file(filename)
	}

	for (const { src, dest } of init_logic.get_ai_copy_file_mappings()) {
		sync_file_mapping(path.join(PACKAGE_DIR, src), path.join(PROJECT_ROOT, dest))
	}

	for (const directory_name of init_logic.get_ai_copy_directories()) {
		sync_directory(directory_name)
	}

	console.info('\n✅ Done.\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()

const sync = { sync_file_mapping }

export { sync }
