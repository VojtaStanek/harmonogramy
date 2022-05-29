import {DataBindingProvider, EntitySubTree, FeedbackRenderer, SugaredQualifiedSingleEntity } from '@contember/admin'
import * as React from 'react'
import { ComponentType, memo, ReactNode } from 'react'

export type EditPageProps =
	& SugaredQualifiedSingleEntity
	& {
	children: ReactNode
	refreshDataBindingOnPersist?: boolean
}

const FullScreenEditPage: ComponentType<EditPageProps> = memo(
	({ children, onPersistSuccess, refreshDataBindingOnPersist, ...entityProps }: EditPageProps) => (
		<DataBindingProvider stateComponent={FeedbackRenderer} refreshOnPersist={refreshDataBindingOnPersist ?? true}>
			<EntitySubTree {...entityProps}>
				{children}
			</EntitySubTree>
		</DataBindingProvider>
	),
)

FullScreenEditPage.displayName = 'FullScreenEditPage'

export { FullScreenEditPage }
