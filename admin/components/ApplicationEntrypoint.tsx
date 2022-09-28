import * as React from 'react'
import { Environment, EnvironmentContext, EnvironmentExtensionProvider } from '@contember/admin'
import { ContemberClient, ContemberClientProps } from '@contember/admin'
import { DialogProvider, SectionTabsProvider, StyleProvider, Toaster, ToasterProvider } from '@contember/admin'
import { ReactNode } from 'react'
import { I18nProvider, MessageDictionaryByLocaleCode } from '@contember/admin'
import { RequestProvider, RouteMap, RoutingContext, RoutingContextValue, SelectedDimension } from '@contember/admin'
import { IdentityProvider } from './IdentityProvider'
import { NavigationProvider } from '@contember/admin'
import { BindingError } from '@contember/binding'

const projectEnvironmentExtension = Environment.createExtension((slug: string | null | undefined) => {
	if (slug === undefined) {
		throw new BindingError('Environment does not contain project slug state.')
	}
	return {
		slug: slug ?? undefined,
	}
})

export interface ApplicationEntrypointProps extends ContemberClientProps {
	basePath?: string
	sessionToken?: string
	routes?: RouteMap
	defaultDimensions?: SelectedDimension
	defaultLocale?: string
	dictionaries?: MessageDictionaryByLocaleCode
	envVariables?: Record<string, string>
	children: ReactNode
	onInvalidIdentity?: () => void
}

const validateProps = (props: Partial<ApplicationEntrypointProps>) => {
	if (typeof props.apiBaseUrl !== 'string') {
		throw new Error(`The ENV variables haven't been set. Check your \`.env.development.local\` file.`) // TODO: better message
	}
}

export const ApplicationEntrypoint = (props: ApplicationEntrypointProps) => {
	validateProps(props)
	const projectSlug = props.project === '__PROJECT_SLUG__'
		? window.location.pathname.split('/')[1]
		: props.project
	const basePath = props.basePath === './'
		? `/${projectSlug}/`
		: (props.basePath ?? '/')

	const routing: RoutingContextValue = {
		basePath,
		routes: props.routes ?? { index: { path: '/' } },
		defaultDimensions: props.defaultDimensions,
	}

	const rootEnv = Environment.create()
		.withVariables(props.envVariables)
		.withDimensions(props.defaultDimensions ?? {})

	return (
		<StyleProvider>
			<EnvironmentContext.Provider value={rootEnv}>
				<I18nProvider localeCode={props.defaultLocale} dictionaries={props.dictionaries}>
					<RoutingContext.Provider value={routing}>
						<RequestProvider>
							<ToasterProvider>
								<ContemberClient
									apiBaseUrl={props.apiBaseUrl}
									sessionToken={props.sessionToken}
									loginToken={props.loginToken}
									project={projectSlug}
									stage={props.stage}
								>
									<EnvironmentExtensionProvider extension={projectEnvironmentExtension} state={projectSlug ?? null}>
										<DialogProvider>
											<NavigationProvider>
												<IdentityProvider onInvalidIdentity={props.onInvalidIdentity}>
													<SectionTabsProvider>
														{props.children}
													</SectionTabsProvider>
												</IdentityProvider>
											</NavigationProvider>
											<Toaster />
										</DialogProvider>
									</EnvironmentExtensionProvider>
								</ContemberClient>
							</ToasterProvider>
						</RequestProvider>
					</RoutingContext.Provider>
				</I18nProvider>
			</EnvironmentContext.Provider>
		</StyleProvider>
	)
}