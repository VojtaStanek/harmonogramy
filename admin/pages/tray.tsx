import {
	Button, Checkbox,
	Component, DateTimeField,
	EditPage, Entity, EntityAccessor,
	Field,
	FieldContainer,
	HasOne,
	MultiEditPage,
	MultiSelectField,
	NumberField,
	Repeater,
	SelectField,
	Stack,
	TextareaField,
	TextField,
	useEntity,
	useEntityList,
	useEntityListSubTree
} from "@contember/admin";
import * as React from "react";
import {useState} from "react";

interface CheckboxHasOneField {
	field: string
	label: string
	children: React.ReactNode
	create: (accessor: EntityAccessor) => void
}

const CheckboxHasOne = Component<CheckboxHasOneField>(
	({ field, label, children, create }) => {
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
							update(it => it+1)
						})
					}} />
				</FieldContainer>
				{exists && <Entity accessor={entity}>
					{children}
				</Entity>}
			</Stack>
		)
	},
	({ field, label, children }) => (
		<HasOne field={field}>
			{children}
		</HasOne>
	)
)

const PlannablesEdit = Component(
	() => {
		const list = useEntityList('plannables')
		const options = useEntityListSubTree({entities: 'AtendeesGroup'})

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
					<MultiSelectField label="Skupiny" field="atendeeGroups" options="AtendeesGroup.name" />
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
				options="AtendeesGroup"
				renderOption={() => null}
				optionsStaticRender={<>
					<Field field="name" />
					<Field field="regular" />
				</>}
			/>

			<CheckboxHasOne field="scheduled" label="Naplánované">
				<DateTimeField label="Začátek" field="start" />
			</CheckboxHasOne>
		</Repeater>
	)
)

export default () => (
	<EditPage entity="Schedule(id=$scheduleId)">
		<Repeater label="Programy v zásobníku" field="trayItems" orderBy="title">
			<TextField label="Název" field="title" />
			<TextareaField label="Popis" field="description" />
			<NumberField label="Délka (minuty)" field="duration" />
			<SelectField label="Skupina programů" field="programmeGroup" options="ProgrammeGroup.name" />
			<MultiSelectField label="Garanti programu" field="owner" options="Person.name" />
			<TextareaField label="Poznámka" field="note" />

			<FieldContainer useLabelElement={false} label="Výběr skupin">
				<PlannablesEdit />
			</FieldContainer>
		</Repeater>
	</EditPage>
)
