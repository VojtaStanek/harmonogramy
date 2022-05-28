import {Button, Stack} from "@contember/admin";
import * as React from "react";
import {memo} from "react";

export interface DialogProps {
	onDismiss: () => void;
	onSubmit: () => void;
	submitDisabled?: boolean;
	children: React.ReactNode;
}

export const Dialog = memo<DialogProps>(({ onDismiss, onSubmit, children, submitDisabled = false }) => {
	const onBackdropClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onDismiss();
		}
	}, [onDismiss])

	const onButtonClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		if (!submitDisabled) {
			onSubmit();
		}
	}, [submitDisabled, onSubmit])

	return (
		<div
			className="dialog"
			onClick={onBackdropClick}
		>
			<div className="dialog__content">
				<Stack direction="vertical">
					{children}
					<Button
						distinction="primary"
						onClick={onButtonClick}
						disabled={submitDisabled}
					>
						Uložit
					</Button>
				</Stack>
			</div>
		</div>
	)
})
