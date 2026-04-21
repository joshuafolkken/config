const VISUALIZER_PACKAGE = 'rollup-plugin-visualizer'
const VISUALIZER_IMPORT = "import { visualizer } from 'rollup-plugin-visualizer'"
const VISUALIZER_CALL = "visualizer({ open: true, filename: 'stats.html' })"

function find_last_import_pos(content: string): number {
	const last_match = [...content.matchAll(/^import\s[^\n]+\n/gmu)].at(-1)
	if (last_match === undefined) return 0

	return last_match.index + last_match[0].length
}

function inject_visualizer_import(content: string): string {
	const pos = find_last_import_pos(content)

	return `${content.slice(0, pos)}${VISUALIZER_IMPORT}\n${content.slice(pos)}`
}

function inject_visualizer_plugin(content: string): string {
	return content.replace(/plugins:\s*\[([^\]]*)\]/u, (_, inner: string) => {
		const trimmed = inner.trim()
		const plugins = trimmed.length > 0 ? `${trimmed}, ${VISUALIZER_CALL}` : VISUALIZER_CALL

		return `plugins: [${plugins}]`
	})
}

function merge_vite_config(content: string): string {
	if (content.includes(VISUALIZER_PACKAGE)) return content

	return inject_visualizer_plugin(inject_visualizer_import(content))
}

const init_logic_vite = {
	merge_vite_config,
}

export { init_logic_vite }
