import {CreatePage, TextField} from "@contember/admin";
import * as React from "react";

export default () => (
	<CreatePage entity="Workspace" rendererProps={{title: "Nový prostor"}} redirectOnSuccess="workspace(workspaceId:$entity.id)">
		<TextField label="Název" field="name" />
	</CreatePage>
)
