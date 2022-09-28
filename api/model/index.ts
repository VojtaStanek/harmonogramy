import {SchemaDefinition as def, AclDefinition as acl} from "@contember/schema-definition";

export const workspaceAdminRole = acl.createRole('workspaceAdmin')
export const workspaceAdminWorkspace = acl.createEntityVariable('workspace', 'Workspace', workspaceAdminRole)

export const scheduleViewRole = acl.createRole('scheduleViewer')
export const scheduleViewSchedule = acl.createEntityVariable('schedule', 'Schedule', scheduleViewRole)


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
@acl.allow(scheduleViewRole, {
	when: { schedules: acl.canRead('workspace') },
	read: true,
})
export class Workspace {
	name = def.stringColumn().notNull()
	schedules = def.oneHasMany(Schedule, 'workspace')
}

@acl.allow(workspaceAdminRole, {
	when: { workspace: acl.canUpdate('name') },
	...allowAll,
})
@acl.allow(scheduleViewRole, {
	when: { id: scheduleViewSchedule },
	read: true,
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
@acl.allow(scheduleViewRole, {
	when: { schedule: acl.canRead('programmeGroups') },
	read: true,
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
@acl.allow(scheduleViewRole, {
	when: { schedule: acl.canRead('atendeesGroups') },
	read: true,
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
@acl.allow(scheduleViewRole, {
	when: { schedule: acl.canRead('people') },
	read: true,
})
export class Person {
	schedule = def.manyHasOne(Schedule, 'people').notNull().cascadeOnDelete()
	name = def.stringColumn().notNull()
}

@acl.allow(workspaceAdminRole, {
	when: { schedule: acl.canUpdate('name') },
	...allowAll,
})
@acl.allow(scheduleViewRole, {
	when: { schedule: acl.canRead('trayItems') },
	read: true,
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
@acl.allow(scheduleViewRole, {
	when: { trayItem: acl.canRead('plannables') },
	read: true,
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
@acl.allow(scheduleViewRole, {
	when: { plannable: acl.canRead('scheduled') },
	read: true,
})
export class ScheduledItem {
	start = def.dateTimeColumn().notNull()
	plannable = def.oneHasOne(Plannable, 'scheduled').notNull().cascadeOnDelete()
}
