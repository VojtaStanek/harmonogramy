import * as React from 'react'
import { useDirtinessState } from '@contember/admin'

export const usePreventLeavingWithUnsavedChanges = () => {
	const isDirty = useDirtinessState()

	React.useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (isDirty) {
				event.preventDefault()
				event.returnValue = ''
			}
		}
		window.addEventListener('beforeunload', handler)
		return () => window.removeEventListener('beforeunload', handler)
	}, [isDirty])
}
