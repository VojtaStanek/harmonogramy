import {SchemaDefinition as def} from "@contember/schema-definition";

export class Schedule {
	name = def.stringColumn().notNull()
	startDate = def.dateColumn().notNull()
	programmeGroups = def.oneHasMany(ProgrammeGroup, 'schedule')
	atendeesGroups = def.oneHasMany(AtendeesGroup, 'schedule')
	people = def.oneHasMany(Person, 'schedule')
	trayItems = def.oneHasMany(TrayItem, 'schedule')
}

export class ProgrammeGroup {
	schedule = def.manyHasOne(Schedule, 'programmeGroups').notNull()
	name = def.stringColumn().notNull()
	color = def.stringColumn().notNull()
}

export class AtendeesGroup {
	schedule = def.manyHasOne(Schedule, 'atendeesGroups').notNull()
	name = def.stringColumn()
	regular = def.boolColumn().default(true).notNull()
}

export class Person {
	schedule = def.manyHasOne(Schedule, 'people').notNull()
	name = def.stringColumn().notNull()
}

export class TrayItem {
	schedule = def.manyHasOne(Schedule, 'trayItems').notNull()
	title = def.stringColumn().notNull()
	description = def.stringColumn().notNull().default('')
	duration = def.intColumn().notNull() // minutes
	programmeGroup = def.manyHasOne(ProgrammeGroup).notNull()
	owner = def.manyHasMany(Person).orderBy('name')
	note = def.stringColumn().notNull().default('')
	plannables = def.oneHasMany(Plannable, 'trayItem')
}

export class Plannable {
	trayItem = def.manyHasOne(TrayItem, 'plannables').notNull().cascadeOnDelete()
	atendeeGroups = def.manyHasMany(AtendeesGroup)
	scheduled = def.oneHasOneInverse(ScheduledItem, 'plannable')
}

export class ScheduledItem {
	start = def.dateTimeColumn().notNull()
	plannable = def.oneHasOne(Plannable, 'scheduled').notNull().cascadeOnDelete()
}
