import type { CommandEntry } from './josh-command-types'

const LATEST_UPDATE_SCRIPT = 'scripts/latest-update.ts'
const LATEST_UPDATE_DESCRIPTION = 'Update all dependencies to latest'

/* eslint-disable @typescript-eslint/naming-convention */
const MAINTENANCE_COMMANDS: Record<string, CommandEntry> = {
	overrides: {
		script: 'scripts/overrides-check.ts',
		description: 'Check pnpm overrides for drift',
		category: 'Maintenance',
	},
	audit: {
		script: 'scripts/security-audit.ts',
		description: 'Run security audit',
		category: 'Maintenance',
	},
	latest: {
		script: LATEST_UPDATE_SCRIPT,
		description: LATEST_UPDATE_DESCRIPTION,
		category: 'Maintenance',
	},
	'latest:update': {
		script: LATEST_UPDATE_SCRIPT,
		description: LATEST_UPDATE_DESCRIPTION,
		category: 'Maintenance',
	},
}
/* eslint-enable @typescript-eslint/naming-convention */

export { MAINTENANCE_COMMANDS }
