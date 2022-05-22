import * as React from 'react'
import { ApplicationEntrypoint, Pages, runReactApp } from '@contember/admin'
import '@contember/admin/style.css'
import './style.css'
import { Layout } from './components/Layout'
import { csCZ } from '@contember/admin-i18n'

runReactApp(
	<ApplicationEntrypoint
		basePath={import.meta.env.BASE_URL}
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN}
		project={import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME}
		stage="live"
		children={<Pages layout={Layout} children={import.meta.glob('./pages/**/*.tsx')} />}
		dictionaries={{ 'cs-CZ': csCZ }}
		defaultLocale="cs-CZ"
	/>,
)
