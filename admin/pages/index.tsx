import * as React from 'react'
import {DataGridPage, DeleteEntityButton, GenericCell, GenericPage, LinkButton, TextCell} from '@contember/admin'

export default () => (
	<DataGridPage entities="Workspace" rendererProps={{ title: "Prostory", actions: <LinkButton to="createWorkspace">Nový prostor</LinkButton> }}>
		<TextCell header="Název" field="name" />
		<GenericCell shrunk canBeHidden={false}>
			<LinkButton to="workspace(workspaceId:$entity.id)">Harmonogramy</LinkButton>
		</GenericCell>
		<GenericCell shrunk canBeHidden={false}>
			<DeleteEntityButton immediatePersist />
		</GenericCell>
	</DataGridPage>
)
