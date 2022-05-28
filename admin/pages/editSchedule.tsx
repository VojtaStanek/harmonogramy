import {EditPage, Field} from "@contember/admin";
import * as React from "react";
import {ScheduleForm} from "../components/ScheduleForm";

export default () => (
	<EditPage
		entity="Schedule(id=$scheduleId)"
		rendererProps={{
			title: <><Field field="name" />: Upravit nastavení</>,
		}}
		redirectOnSuccess="composeSchedule(scheduleId:$entity.id)"
	>
		<ScheduleForm />
	</EditPage>
)
