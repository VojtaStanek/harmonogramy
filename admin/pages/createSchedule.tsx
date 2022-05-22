import {CreatePage} from "@contember/admin";
import * as React from "react";
import {ScheduleForm} from "../components/ScheduleForm";

export default () => (
	<CreatePage entity="Schedule" rendererProps={{title: "Nový harmonogram"}} redirectOnSuccess="index">
		<ScheduleForm />
	</CreatePage>
)
