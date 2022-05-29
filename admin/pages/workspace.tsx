import * as React from 'react'
import {DataGridPage, DeleteEntityButton, GenericCell, GenericPage, LinkButton, TextCell} from '@contember/admin'

export default () => (
	<DataGridPage
		entities="Schedule[workspace.id=$workspaceId]"
		rendererProps={{
			title: "Harmonogramy",
			actions: <LinkButton to="createSchedule(workspaceId:$request.workspaceId)">Nový harmonogram</LinkButton>,
		}}
	>
		<TextCell header="Název" field="name" />
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="editSchedule(scheduleId:$entity.id)">Nastavení</LinkButton>
		</GenericCell>
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="tray(scheduleId:$entity.id)">Zásobník</LinkButton>
		</GenericCell>
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="composeSchedule(scheduleId:$entity.id)">Plánovat</LinkButton>
		</GenericCell>
		<GenericCell shrunk canBeHidden={false}>
			<DeleteEntityButton immediatePersist />
		</GenericCell>
	</DataGridPage>
)
