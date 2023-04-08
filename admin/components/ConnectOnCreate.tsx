import {
	Component,
	EntityAccessor,
	EntityListAccessor,
	EntityListSubTree,
	EntitySubTree,
	HasOne,
	useEntity,
	useEntityListSubTree,
	useEntitySubTree
} from "@contember/admin";
import * as React from "react";
import {useEffect} from "react";

export const ConnectOnCreate = Component<{ field: string, entityToConnect: string, list: boolean }>(
	(props) => {
		const entity = useEntity()
		const toConnect = props.list ? useEntityListSubTree(props.entityToConnect) : useEntitySubTree(props.entityToConnect)
		useEffect(() => {
			const connected = entity.getEntity(props.field);
			const connectable = props.list
				? ((toConnect as EntityListAccessor).length == 1 ? Array.from(toConnect as EntityListAccessor)[0] : null)
				: toConnect as EntityAccessor
			if (!connected.existsOnServer && !connected.hasUnpersistedChanges && (connectable?.existsOnServer ?? false)) {
				entity.connectEntityAtField(props.field, connectable!)
			}
		}, [])

		return null
	},
	(props, env) => {
		return (
			<>
				<HasOne field={props.field} />
				{props.list ? (
					<EntityListSubTree entities={props.entityToConnect} alias={props.entityToConnect}></EntityListSubTree>
				) : (
					<EntitySubTree entity={props.entityToConnect} alias={props.entityToConnect}></EntitySubTree>
				)}

			</>
		)
	},
	'ConnectOnCreate',
)
