import {EditPage, Repeater} from "@contember/admin";
import * as React from "react";
import {TrayItemForm} from "../components/trayItemForm";

export default () => (
	<EditPage entity="Schedule(id=$scheduleId)">
		<Repeater label="Programy v zásobníku" field="trayItems" orderBy="title">
			<TrayItemForm />
		</Repeater>
	</EditPage>
)
