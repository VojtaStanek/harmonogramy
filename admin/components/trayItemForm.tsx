import * as React from "react";
import {useState} from "react";
import {
	Button, ButtonGroup, ButtonProps,
	Component,
	DateTimeField,
	Entity,
	EntityAccessor,
	Field,
	FieldContainer,
	HasOne,
	MultiSelectField,
	NumberField, RadioField,
	Repeater,
	SelectField,
	Stack,
	TextareaField,
	TextField,
	useEntity,
	useEntityList,
	useEntityListSubTree, useField
} from "@contember/admin";

interface CheckboxHasOneField {
	field: string
	label: string
	children: React.ReactNode
	create: (accessor: EntityAccessor) => void
}

const CheckboxHasOne = Component<CheckboxHasOneField>(
	({field, label, children, create}) => {
		const entity = useEntity(field)
		const exists = entity.existsOnServer || entity.hasUnpersistedChanges
		const [, update] = useState(0)
		return (
			<Stack direction="vertical">
				<FieldContainer label={label} labelPosition="labelInlineRight">
					<input type={"checkbox"} checked={exists} onChange={e => {
						e.preventDefault()
						const value = e.target.checked
						if (value) {
							create(entity)
						} else {
							entity.deleteEntity()
						}

						// It's broken
						requestAnimationFrame(() => {
							update(it => it + 1)
						})
					}} />
				</FieldContainer>
				{exists && <Entity accessor={entity}>
					{children}
				</Entity>}
			</Stack>
		)
	},
	({field, label, children}) => (
		<HasOne field={field}>
			{children}
		</HasOne>
	)
)
const PlannablesEdit = Component(
	() => {
		const list = useEntityList('plannables')
		const options = useEntityListSubTree({entities: 'AtendeesGroup[schedule.id=$scheduleId]'})

		const createPlannables = React.useCallback((count: number, regular: boolean) => {
			const base = Array.from(options).filter(it => it.getField('regular').value === regular)
			let usedGroups = 0;
			for (let i = 0; i < count; i++) {
				const groupsCounts = Math.floor(base.length / count) + (i < base.length % count ? 1 : 0)
				const toConnect = base.slice(usedGroups, usedGroups + groupsCounts)
				usedGroups += groupsCounts
				list.createNewEntity(getAccessor => {
					const groups = getAccessor().getEntityList('atendeeGroups')
					for (const option of toConnect) {
						groups.connectEntity(option)
					}
				})
			}
		}, [])

		if (list.isEmpty()) {
			return (
				<Stack direction="horizontal">
					<Button onClick={() => createPlannables(1, true)}>Všechny skupiny</Button>
					<Button onClick={() => createPlannables(2, true)}>Na půlky</Button>
					<Button onClick={() => createPlannables(3, true)}>Na třetiny</Button>
					<Button onClick={() => createPlannables(1, false)}>Instruktoři</Button>
				</Stack>
			)
		} else {
			return (
				<Repeater label={undefined} field="plannables" orderBy={undefined}>
					<MultiSelectField label="Skupiny" field="atendeeGroups" options="AtendeesGroup[schedule.id=$scheduleId].name" />
					<CheckboxHasOne field="scheduled" label="Naplánované" create={(acc) => acc.getField('start').updateValue('')}>
						<DateTimeField label="Začátek" field="start" />
					</CheckboxHasOne>
				</Repeater>
			)
		}
	},
	() => (
		<Repeater label={undefined} field="plannables" orderBy={undefined} initialEntityCount={0}>
			<MultiSelectField
				label="Skupiny"
				field="atendeeGroups"
				options="AtendeesGroup[schedule.id=$scheduleId]"
				renderOption={() => null}
				optionsStaticRender={<>
					<Field field="name" />
					<Field field="regular" />
				</>}
			/>

			<CheckboxHasOne field="scheduled" label="Naplánované" create={() => {}}>
				<DateTimeField label="Začátek" field="start" />
			</CheckboxHasOne>
		</Repeater>
	)
)

export function isTrayItemComplete(entity: EntityAccessor): boolean {
	if ((entity.getField('title').value ?? '') === '') {
		return false
	}

	if ((entity.getField('duration').value ?? 0) === 0) {
		return false
	}

	const group = entity.getEntity('programmeGroup');
	if (!group.existsOnServer && !group.hasUnpersistedChanges) {
		return false
	}

	const plannables = entity.getEntityList('plannables')
	if (plannables.isEmpty()) {
		return false
	}

	return true
}

interface SetFieldToValueButtonProps {
	field: string
	value: any
	buttonProps?: Omit<ButtonProps, 'onClick'>
	children?: React.ReactNode
}

const SetFieldToValueButton = Component<SetFieldToValueButtonProps>(
	({ field, value, buttonProps, children }) => {
		const accessor = useField(field)
		const onClick = React.useCallback(() => {
			accessor.updateValue(value)
		}, [value, accessor])

		return (
			<Button
				onClick={onClick}
				{...buttonProps}
			>
				{children ?? buttonProps?.children ?? value}
			</Button>
		)
	},
	({ field }) => (
		<Field field={field} />
	),
	'SetFieldToValueButton',
)

export const TrayItemForm = Component(
	() =>
		(
			<Stack direction="vertical">
				<TextField label="Název*" field="title" />
				<TextareaField label="Popis" field="description" />
				<Stack direction="horizontal" align="end">
					<Stack direction="vertical" grow>
						<NumberField label="Délka (minuty)" field="duration" />
					</Stack>
					<ButtonGroup>
						{[10, 15, 30, 45, 60, 90].map(it => (
							<SetFieldToValueButton key={it} field="duration" value={it} />
						))}
					</ButtonGroup>
				</Stack>
				<RadioField
					label="Skupina programů*"
					field="programmeGroup"
					options={{
						entities: "ProgrammeGroup[schedule.id=$scheduleId]",
						orderBy: "name",
					}}
					renderOption={acc => acc.getField('name').value}
					optionsStaticRender={(
						<>
							<Field field="name" />
							<Field field="color" />
						</>
					)}
					orientation="horizontal"
				/>
				<MultiSelectField label="Garanti programu" field="owner" options="Person[schedule.id=$scheduleId].name" />
				<TextareaField label="Poznámka" field="note" />

				<FieldContainer useLabelElement={false} label="Výběr skupin">
					<PlannablesEdit />
				</FieldContainer>
			</Stack>
		),
	'TrayItemForm',
)
