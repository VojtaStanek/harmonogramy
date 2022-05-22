import * as React from 'react'
import { DataGridPage, GenericCell, GenericPage, LinkButton, TextCell } from '@contember/admin'

export default () => (
	<DataGridPage entities="Schedule" rendererProps={{ title: "Harmonogramy", actions: <LinkButton to="createSchedule">Nový harmonogram</LinkButton> }}>
		<TextCell header="Název" field="name" />
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="editSchedule(scheduleId:$entity.id)">Změnit</LinkButton>
		</GenericCell>
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="tray(scheduleId:$entity.id)">Zásobník</LinkButton>
		</GenericCell>
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="composeSchedule(scheduleId:$entity.id)">Plánovat</LinkButton>
		</GenericCell>
	</DataGridPage>
)
