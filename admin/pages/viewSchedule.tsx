import * as React from "react";
import {FullScreenEditPage} from "../components/FullScreenEditPage";
import {ComposeSchedule} from "../components/ComposeSchedule";

export default () => (
	<FullScreenEditPage entity="Schedule(id=$scheduleId)">
		<ComposeSchedule editable={false} />
	</FullScreenEditPage>
)
