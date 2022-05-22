import {EditPage} from "@contember/admin";
import * as React from "react";
import {ScheduleForm} from "../components/ScheduleForm";

export default () => (
	<EditPage entity="Schedule(id=$scheduleId)" rendererProps={{title: "Upravit harmonogram"}}>
		<ScheduleForm />
	</EditPage>
)
