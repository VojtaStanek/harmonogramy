import {
	CheckboxField,
	ColorField,
	Component,
	DateField,
	Repeater, Section,
	Stack,
	TextField
} from "@contember/admin";
import * as React from "react";

export const ScheduleForm = Component(
	() => (
		<>
			<TextField field="name" label="Název" size="large" />
			<DateField field="startDate" label="První den" />

			<Section heading="Skupiny programů">
				<Repeater label={undefined} field="programmeGroups" orderBy="name">
					<Stack direction="horizontal-reverse">
						<div style={{flexGrow: 1}}>
							<TextField label="Název" field="name" />
						</div>
						<div style={{flexBasis: '20%'}}>
							<ColorField label="Barva" field="color" defaultValue="#ff0000" />
						</div>
					</Stack>
				</Repeater>
			</Section>

			<Section heading="Skupiny lidí">
				<Repeater label={undefined} field="atendeesGroups" orderBy="name">
					<TextField label="Název" field="name" />
					<CheckboxField label="Běžná skupina (tedy účastníci a ne instruktoři)" field="regular" defaultValue={true} />
				</Repeater>
			</Section>

			<Section heading="Instruktoři">
				<Repeater label={undefined} field="people" orderBy="name">
					<TextField label="Jméno" field="name" />
				</Repeater>

			</Section>
		</>
	)
)
