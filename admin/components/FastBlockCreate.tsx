import {EntityAccessor, FieldContainer} from "@contember/admin";
import * as React from "react";
import {useCallback, useReducer} from "react";
import {Temporal} from "@js-temporal/polyfill";

const phaseOrder = ['group', 'name', 'duration'] as const;

type Phase = 'group' | 'name' | 'duration';
const phaseLabels: Record<Phase, string> = {
	group: 'Skupina programů',
	name: 'Název',
	duration: 'Délka',
}
type FastBlockCreateState = {
	phase: Phase
	name: string
	group: string
	duration: string
}

type FastBlockCreateAction =
	| { type: 'change', data: Phase, value: string }
	| { type: 'submit' }

function computeDurationFromInput(start: Temporal.PlainTime, input: string): number {
	// Duration in HHhMMm or HHh or HHhMM format
	const match = input.toLowerCase().match(/^(\d+)h(\d+)?m?$/);
	if (match) {
		const hours = parseInt(match[1]);
		const minutes = parseInt(match[2] ?? '0');
		return hours * 60 + minutes;
	}

	// If int then it's minutes
	const parsedInt = parseInt(input);
	if (!isNaN(parsedInt)) {
		return parsedInt;
	}

	// If string then it's end in format HH:MM, we need to compute duration from start
	try {
		const end = Temporal.PlainTime.from(input);
		return Math.round((end.since(start)).total({ unit: 'minute' }));
	} catch (e) {
	}
	return 0;
}

function getGroupCandidates(groups: EntityAccessor[], input: string): EntityAccessor[] {
	if (input.length == 0) {
		return groups;
	}
	const lowercased = input.toLocaleLowerCase();
	const candidates = groups.filter(g => g.getField<string>('name').value!.toLocaleLowerCase().startsWith(lowercased));
	candidates.sort((a, b) => a.getField<string>('name').value!.localeCompare(b.getField<string>('name').value!));
	return candidates;
}

export type FastBlockCreateOnSubmit = (data: { name: string, group: EntityAccessor, duration: number }) => void;
export type FastBlockCreateProps = {
	startTime: Temporal.PlainTime
	onSubmit: FastBlockCreateOnSubmit
	groups: EntityAccessor[]
	onDismiss: () => void
}

export const FastBlockCreate: React.FC<FastBlockCreateProps> = ({ startTime, onSubmit, groups, onDismiss }) => {
	const reducer = useCallback((state: FastBlockCreateState, action: FastBlockCreateAction): FastBlockCreateState => {
		switch (action.type) {
			case 'change':
				return {
					...state,
					phase: action.data,
					[action.data]: action.value,
				}
			case 'submit':
				const isLastPhase = phaseOrder.indexOf(state.phase) === phaseOrder.length - 1;
				if (isLastPhase) {
					const groupEntity = groups.find(g => g.id == state.group)!
					onSubmit({
						name: state.name,
						group: groupEntity,
						duration: computeDurationFromInput(startTime, state.duration),
					})
					return state
				}
				const nextPhase = phaseOrder[phaseOrder.indexOf(state.phase) + 1];
				// const isValid = (state.phase == "duration" ?)

				if (state.phase == 'group') {
					const sortedCandidates = getGroupCandidates(groups, state.group);
					if (sortedCandidates.length == 0) {
						return state;
					}
					state.group = sortedCandidates[0].id as string;
				}
				return {
					...state,
					phase: nextPhase,
				}
		}
	}, [groups, onSubmit])

	const [state, dispatch] = useReducer<typeof reducer>(reducer, { phase: 'group', name: '', group: '', duration: '' })

	let inner = null
	switch (state.phase) {
		case 'group':
			const candidates = getGroupCandidates(groups, state.group).map(g => g.getField<string>('name').value!);
			let note: string;
			if (state.group == "") {
				note = `Začněte psát: ${candidates.join(', ')}`;
			} else if (candidates.length == 0) {
				note = `Žádná skupina nezačíná na ${state.group}`;
			} else {
				note = `${candidates[0]}: stisni enter pro vybrání`;
			}
			inner = (
				<FastInput
					label="Skupina"
					value={state.group}
					onChange={value => dispatch({ type: 'change', data: 'group', value })}
					onSubmit={() => dispatch({ type: 'submit' })}
					onDismiss={onDismiss}
					note={note}
				/>
			)
			break
		case 'name':
			inner = (
				<FastInput
					label="Název programu"
					value={state.name}
					onChange={value => dispatch({ type: 'change', data: 'name', value })}
					onDismiss={onDismiss}
					onSubmit={() => dispatch({ type: 'submit' })}
				/>
			)
			break
		case 'duration':
			const endTime = startTime.add({ minutes: computeDurationFromInput(startTime, state.duration) });
			inner = (
				<FastInput
					label="Délka"
					value={state.duration}
					onChange={value => dispatch({ type: 'change', data: 'duration', value })}
					onSubmit={() => dispatch({ type: 'submit' })}
					onDismiss={onDismiss}
					note={state.duration == "" ? "Zadejte délku nebo konec ve formátu HH:MM" : `${startTime.toString({smallestUnit: "minute"})} - ${endTime.toString({smallestUnit: "minute"})}`}
				/>
			)
			break
	}

	const completedValues = phaseOrder.slice(0, phaseOrder.indexOf(state.phase)).map(phase => (
		<div key={phase} className="fastInput__completedValue">
			<strong>{phaseLabels[phase]}:</strong>{' '}
			{phase == "group" ? groups.find(g => g.id == state.group)?.getField<string>('name').value! : state[phase]}
		</div>

	))

	return (
		<FastInputFullScreenWrapper>
			<h3 className="fastInput__title">
				Nový program v {startTime.toString({smallestUnit: "minute"})}
			</h3>
			{completedValues}
			{inner}
		</FastInputFullScreenWrapper>
	)

}

type FastInputProps = {
	value: string
	onChange: (value: string) => void
	label: string
	onSubmit?: () => void
	onDismiss?: () => void
	note?: string
}

const FastInput: React.FC<FastInputProps> = ({ value, onChange, label, onSubmit, note, onDismiss }) => {
	return (
		<FieldContainer label={label} description={note}>
			<input
				className="fastInput__input"
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						onSubmit?.()
					}
					if (e.key === 'Escape') {
						onDismiss?.()
					}
				}}
				autoFocus={true}
			/>
		</FieldContainer>
	)
}

const FastInputFullScreenWrapper: React.FC<{}> = ({ children }) => {
	return (
		<div className="fastInput__fullScreenWrapper">
			<div className="fastInput__fullScreenWrapperInner">
				{children}
			</div>
		</div>
	)
}
