import * as React from 'react'
import { ReactNode } from 'react'
import { Layout as ContemberLayout } from '@contember/admin'

export const Layout = (props: { children?: ReactNode }) => (
	<ContemberLayout
		children={props.children}
	/>
)
