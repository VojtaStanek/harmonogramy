import * as React from 'react'
import { Pages, runReactApp } from '@contember/admin'
import '@contember/admin/style.css'
import './style.css'
import { Layout } from './components/Layout'
import { csCZ } from '@contember/admin-i18n'
import { ApplicationEntrypoint } from './components/ApplicationEntrypoint'

const sessionTokenEnv = import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN
const sessionToken = sessionTokenEnv === 'FROM_URL' ? (new URLSearchParams(window.location.search).get('token') ?? 'INVALID_TOKEN') : sessionTokenEnv

if (sessionToken === 'INVALID_TOKEN') {
	alert('Neplatná adresa')
}

runReactApp(
	<ApplicationEntrypoint
		basePath={import.meta.env.BASE_URL}
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL}
		sessionToken={sessionToken}
		project={import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME}
		stage="live"
		children={<Pages layout={Layout} children={import.meta.glob('./pages/**/*.tsx')} />}
		dictionaries={{ 'cs-CZ': csCZ }}
		defaultLocale="cs-CZ"
	/>,
)
