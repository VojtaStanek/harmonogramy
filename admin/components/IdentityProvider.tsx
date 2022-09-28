import * as React from 'react'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionToken } from '@contember/admin'
import { useFetchMe } from '@contember/admin'
import { ContainerSpinner, Message } from '@contember/admin'
import { MiscPageLayout } from '@contember/admin'
// import { InvalidIdentityFallback } from '@contember/admin'
import { useLogout } from '@contember/admin'
import { EnvironmentExtensionProvider } from '@contember/binding'
import { identityEnvironmentExtension } from '@contember/admin'

export interface Identity {
	email: string
	otpEnabled: boolean
	personId: string
	projects: IdentityProject[]
	permissions: {
		canCreateProject: boolean
	}
}

export interface IdentityProject {
	slug: string
	name: string
	roles: string[]
}

interface IdentityContext {
	clearIdentity: () => void
	identity: Identity
}

export const IdentityContext = createContext<IdentityContext | undefined>(undefined)
export const IdentityRefreshContext = createContext<(() => void)>(() => {
	throw new Error('IdentityRefreshContext is not initialized')
})

interface IdentityProviderProps {
	onInvalidIdentity?: () => void
	allowUnauthenticated?: boolean
}

type IdentityState =
	| { state: 'none' }
	| { state: 'loading'}
	| { state: 'failed'}
	| { state: 'success', identity: Identity }
	| { state: 'cleared'}


interface MeResponse {
	me: {
		person: {
			id: string,
			email: string,
			otpEnabled: boolean,
		} | null,
		projects: Array<{
			project: {
				slug: string,
				name: string,
			},
			memberships: Array<{
				role: string,
				variables: Array<{
					name: string,
					values: string[],
				}>,
			}>,
		}>,
		permissions: {
			canCreateProject: boolean,
		},
	},
}

export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children, onInvalidIdentity, allowUnauthenticated }) => {
	const sessionToken = useSessionToken()
	const fetchMe = useFetchMe()

	const [identityState, setIdentityState] = useState<IdentityState>(() => ({ state: sessionToken ? 'loading' : 'none' }))

	const logout = useLogout()

	const clearIdentity = useCallback(() => setIdentityState({ state: 'cleared' }), [])

	const refetch = useCallback(async () => {
		setIdentityState({ state: 'loading' })
		try {
			const response: { data: MeResponse } = await fetchMe()
			const person = response.data.me.person
			const projects = response.data.me.projects
			const permissions = response.data.me.permissions

			setIdentityState({
				state: 'success',
				identity: {
					email: person?.email ?? '',
					otpEnabled: person?.otpEnabled ?? false,
					personId: person?.id ?? '',
					projects: projects.map(it => ({
						name: it.project.name,
						slug: it.project.slug,
						roles: it.memberships.map(it => it.role),
					})),
					permissions,
				},
			})
		} catch (e) {
			console.error(e)
			if (typeof e === 'object' && e !== null && 'status' in e && (e as { status?: unknown }).status === 401) {
				logout({ noRedirect: true })
				clearIdentity()
				if (onInvalidIdentity) {
					onInvalidIdentity()
				} else if (window.location.pathname !== '/') {
					window.location.href = '/' // todo better redirect?
				}
			} else {
				setIdentityState({ state: 'failed' })
			}
		}
	}, [clearIdentity, fetchMe, logout, onInvalidIdentity])


	useEffect(
		() => {
			if (sessionToken === undefined) {
				setIdentityState({ state: 'none' })
				if (!allowUnauthenticated) {
					if (onInvalidIdentity) {
						onInvalidIdentity()
					} else if (window.location.pathname !== '/') {
						window.location.href = '/' // todo better redirect?
					}
				}
				return
			}
		},
		[sessionToken, allowUnauthenticated, onInvalidIdentity],
	)

	useEffect(
		() => {
			if (sessionToken !== undefined) {
				refetch()
			}
		},
		[sessionToken, refetch],
	)


	const identityContextValue = useMemo(
		() => identityState.state === 'success' ? { clearIdentity, identity: identityState.identity } : undefined,
		[identityState, clearIdentity],
	)

	if (identityState.state === 'cleared') {
		return (
			<MiscPageLayout>
				<Message size="large" flow="generousBlock">Logging out&hellip;</Message>
			</MiscPageLayout>
		)
	}

	if (identityState.state === 'failed') {
		return <>Chyba při načítání identity</>
	}

	if (identityState.state === 'loading' || (!allowUnauthenticated && identityState.state === 'none')) {
		return <ContainerSpinner />
	}

	return (
		<EnvironmentExtensionProvider extension={identityEnvironmentExtension} state={identityContextValue?.identity ?? null}>
			<IdentityContext.Provider value={identityContextValue}>
				<IdentityRefreshContext.Provider value={refetch}>
					{children}
				</IdentityRefreshContext.Provider>
			</IdentityContext.Provider>
		</EnvironmentExtensionProvider>
	)
}
