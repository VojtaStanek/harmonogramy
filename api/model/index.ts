import {SchemaDefinition as def, AclDefinition as acl} from "@contember/schema-definition";

export const workspaceAdminRole = acl.createRole('workspaceAdmin')
export const workspaceAdminWorkspace = acl.createEntityVariable('workspace', 'Workspace', workspaceAdminRole)

const allowAll = {
	create: true,
	read: true,
	update: true,
	delete: true,
} as const

@acl.allow(workspaceAdminRole, {
	when: { id: workspaceAdminWorkspace },
	...allowAll,
})
export class Workspace {
	name = def.stringColumn().notNull()
	schedules = def.oneHasMany(Schedule, 'workspace')
}

@acl.allow(workspaceAdminRole, {
	when: { workspace: acl.canUpdate('name') },
	...allowAll,
})
export class Schedule {
	workspace = def.manyHasOne(Workspace, 'schedules').notNull().cascadeOnDelete()
	name = def.stringColumn().notNull()
	startDate = def.dateColumn().notNull()
	programmeGroups = def.oneHasMany(ProgrammeGroup, 'schedule')
	atendeesGroups = def.oneHasMany(AtendeesGroup, 'schedule')
	people = def.oneHasMany(Person, 'schedule')
	trayItems = def.oneHasMany(TrayItem, 'schedule')
}

@acl.allow(workspaceAdminRole, {
	when: { schedule: acl.canUpdate('name') },
	...allowAll,
})
export class ProgrammeGroup {
	schedule = def.manyHasOne(Schedule, 'programmeGroups').notNull().cascadeOnDelete()
	name = def.stringColumn().notNull()
	color = def.stringColumn().notNull()
}

@acl.allow(workspaceAdminRole, {
	when: { schedule: acl.canUpdate('name') },
	...allowAll,
})
export class AtendeesGroup {
	schedule = def.manyHasOne(Schedule, 'atendeesGroups').notNull().cascadeOnDelete()
	name = def.stringColumn()
	regular = def.boolColumn().default(true).notNull()
}

@acl.allow(workspaceAdminRole, {
	when: { schedule: acl.canUpdate('name') },
	...allowAll,
})
export class Person {
	schedule = def.manyHasOne(Schedule, 'people').notNull().cascadeOnDelete()
	name = def.stringColumn().notNull()
}

@acl.allow(workspaceAdminRole, {
	when: { schedule: acl.canUpdate('name') },
	...allowAll,
})
export class TrayItem {
	schedule = def.manyHasOne(Schedule, 'trayItems').notNull().cascadeOnDelete()
	title = def.stringColumn().notNull()
	description = def.stringColumn().notNull().default('')
	duration = def.intColumn().notNull() // minutes
	programmeGroup = def.manyHasOne(ProgrammeGroup).notNull()
	owner = def.manyHasMany(Person).orderBy('name')
	note = def.stringColumn().notNull().default('')
	plannables = def.oneHasMany(Plannable, 'trayItem')
}

@acl.allow(workspaceAdminRole, {
	when: { trayItem: acl.canUpdate('title') },
	...allowAll,
})
export class Plannable {
	trayItem = def.manyHasOne(TrayItem, 'plannables').notNull().cascadeOnDelete()
	atendeeGroups = def.manyHasMany(AtendeesGroup)
	scheduled = def.oneHasOneInverse(ScheduledItem, 'plannable')
}

@acl.allow(workspaceAdminRole, {
	when: { plannable: acl.canUpdate('scheduled') },
	...allowAll,
})
export class ScheduledItem {
	start = def.dateTimeColumn().notNull()
	plannable = def.oneHasOne(Plannable, 'scheduled').notNull().cascadeOnDelete()
}
