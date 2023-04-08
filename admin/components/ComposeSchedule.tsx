import {
	Button,
	Component, Entity,
	EntityAccessor,
	EntityId,
	Field,
	HasMany,
	HasOne, Icon, LinkButton, PersistButton, useEntityList,
	useField
} from "@contember/admin";
import * as React from "react";
import {Fragment, memo, useCallback, useMemo, useRef, useState} from "react";
import {Temporal} from "@js-temporal/polyfill";
import classNames from "classnames";
import {isTrayItemComplete, TrayItemForm} from "./trayItemForm";
import {Dialog} from "./Dialog";
import {isColorDark} from "../utils/isColorDark";

const LOCAL_TIMEZONE = Temporal.TimeZone.from('Europe/Prague');

const MIME_TYPE = 'application/prs.plannable'

type Segment = { date: Temporal.PlainDate; plannable: EntityAccessor; start: Temporal.PlainTime | null; end: Temporal.PlainTime | null; atendeeGroups: number[] }

function groupNeighbours(_items: number[]): number[][] {
	const items = [..._items];
	items.sort()
	const result: number[][] = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		if (result.length === 0 || result[result.length - 1][result[result.length - 1].length - 1] !== item - 1) {
			result.push([item]);
		} else {
			result[result.length - 1].push(item);
		}
	}

	return result;
}

interface SegmentBoxProps {
	segment: Segment;
	trayItem: EntityAccessor;
	earliestTime: Temporal.PlainTime;
	latestTime: Temporal.PlainTime;
	isHovering: boolean;
	isDragged?: boolean;
	setHovering: (isHovering: boolean) => void;
	dayIndex: number;
	onDragStart: (ratio: number) => void;
	onDragEnd: () => void;
	onClick: () => void;
	editable: boolean;
}

const SegmentBox = memo<SegmentBoxProps>(
	({ segment, trayItem, earliestTime, latestTime, isHovering, isDragged = false, setHovering, dayIndex, onDragStart, onDragEnd, onClick, editable }) => {
		const plannable = segment.plannable
		const dayLength = earliestTime.until(latestTime)
		const setStartTime = segment.start ?? earliestTime
		const startTime = Temporal.PlainTime.compare(setStartTime, earliestTime) < 0 ? earliestTime : setStartTime
		const startOffset = earliestTime.until(startTime).total({unit: 'seconds'}) / dayLength.total({unit: 'seconds'})
		const setEndTime = segment.end ?? latestTime
		const endTime = Temporal.PlainTime.compare(setEndTime, latestTime) > 0 ? latestTime : setEndTime
		const duration = startTime.until(endTime)
		const relativeDuration = duration.total({unit: 'seconds'}) / dayLength.total({unit: 'seconds'})

		const [clickWidthRatio, setClickWidthRatio] = useState(0)

		if (dayIndex < 0) {
			return null
		}

		const color = trayItem.getField<string>('programmeGroup.color').value;
		const isDark = color !== null && isColorDark(color);

		return (
			<div
				className={classNames(
					'scheduleTable__plannable',
					isHovering && 'scheduleTable__plannable--hovering',
					isDragged && 'scheduleTable__plannable--dragged',
					(segment.start?.equals(startTime)) && 'scheduleTable__plannable--start',
					(segment.end?.equals(endTime)) && 'scheduleTable__plannable--end',
					isDark && 'scheduleTable__plannable--dark',
				)}
				style={{
					'--segment-day': dayIndex,
					'--segment-start': startOffset,
					'--segment-duration': relativeDuration,
					'--segment-group-first': segment.atendeeGroups[0],
					'--segment-groups-count': segment.atendeeGroups.length,
					'--segment-color': color,
				} as any}

				{...(editable ? {
					onMouseEnter: () => setHovering(true),
					onMouseLeave: () => setHovering(false),
					draggable: true,
					onDragStart: (e) => {
						console.log(e.nativeEvent)
						e.dataTransfer.setData(MIME_TYPE, plannable.id as string)
						e.dataTransfer.effectAllowed = "move"

						const canvas = document.createElement("canvas");
						canvas.width = canvas.height = 0;
						e.dataTransfer.setDragImage(canvas, 25, 25);

						onDragStart(clickWidthRatio)
					},
					onDragEnd: () => {
						onDragEnd()
					},
					onMouseDown: (e) => {
						if (segment.start !== null && segment.end !== null) {
							setClickWidthRatio(e.nativeEvent.offsetX / e.currentTarget.offsetWidth)
						} else {
							setClickWidthRatio(0)
						}
					},
				} : {})}


				onClick={(e) => {
					e.stopPropagation()
					onClick()
				}}
			>
				<div
					className="scheduleTable__plannableTitle"
					aria-hidden={true}
				>
					{trayItem.getField('title').value}
				</div>
				{/*<div*/}
				{/*	className="scheduleTable__plannableExpansion"*/}
				{/*>*/}
				{/*	{trayItem.getField('title').value}*/}
				{/*	<br />*/}
				{/*	{trayItem.getField('programmeGroup.name').value}*/}
				{/*</div>*/}

			</div>
		);
	},
)

interface TimeLabelsProps {
	earliestTime: Temporal.PlainTime;
	timeLabels: Temporal.PlainTime[];
	dayLength: Temporal.Duration;
}

const TimeLabels = memo<TimeLabelsProps>(({ earliestTime, timeLabels, dayLength }) => {
	return (
		<>
			<div className="scheduleTable__timeLabels">
				{timeLabels.map((label) => {
					const startOffset = earliestTime.until(label).total({unit: 'minutes'}) / dayLength.total({unit: 'minutes'})
					return (
						<div
							key={label.toString()}
							className={`scheduleTable__timeLabel`}
							style={{'--time': startOffset} as any}
						>
							{label.toLocaleString('cs-CZ', {hour: 'numeric', minute: '2-digit'})}
						</div>
					)
				})}
			</div>

			{timeLabels.map((label) => {
				const startOffset = earliestTime.until(label).total({unit: 'minutes'}) / dayLength.total({unit: 'minutes'})
				const isMajor = label.minute === 0
				return (
					<div
						key={label.toString()}
						className={`scheduleTable__timeLine ${isMajor ? 'scheduleTable__timeLine--major' : ''}`}
						style={{'--time': startOffset} as any}
					/>
				)
			})}
		</>
	)
})

interface DateLabelsProps {
	dates: Temporal.PlainDate[];
	atendeeGroups: EntityAccessor[];
}

const DateLabels = memo<DateLabelsProps>(({ dates, atendeeGroups }) => {
	return (
		<>
			{dates.map((date, index) => (
				<Fragment key={date.toString()}>
					<div
						className="scheduleTable__dayLabel"
						style={{'--day': index} as any}
					>
						{date.toLocaleString('cs-CZ', {day: 'numeric', month: 'narrow', weekday: 'short'})}
					</div>

					<div
						className="scheduleTable__day"
						style={{'--day': index} as any}
						data-date={date.toString()}
					/>

					{atendeeGroups.map((group, groupIndex) => (
						<div
							key={group.key}
							className="scheduleTable__groupLabel"
							style={{
								'--group-day': index,
								'--group-index': groupIndex,
							} as any}
						>
							{group.getField<string>('name').value}
						</div>
					))}

					<div
						className="scheduleTable__dayLine"
						style={{'--day': index} as any}
					/>
				</Fragment>
			))}
		</>
	)
})

export const ComposeSchedule = Component<{ editable: boolean }>(
	({ editable }) => {
		const [widthScale, setWidthScale] = useState(1)
		const startDateField = useField<string>('startDate')
		const startDate = useMemo(() => {
			return Temporal.Instant.from(startDateField.value!).toZonedDateTimeISO(LOCAL_TIMEZONE).toPlainDate()
		}, [startDateField.value])
		const trayItems = useEntityList('trayItems')
		const [allPlannables, plannableToTrayItem] = useMemo(() => {
			Array.from(trayItems).flatMap(it => Array.from(it.getEntityList('plannables')))
			const allPlannables = []
			const plannableToTrayItem = new Map<EntityAccessor, EntityAccessor>()
			for (const trayItem of trayItems) {
				for (const plannable of trayItem.getEntityList('plannables')) {
					allPlannables.push(plannable)
					plannableToTrayItem.set(plannable, trayItem)
				}
			}
			return [allPlannables, plannableToTrayItem]
		}, [trayItems])

		const scheduledPlannables = useMemo(() => {
			return allPlannables.filter(it => it.getField('scheduled.start').value !== null)
		}, [allPlannables])

		const notScheduledPlannables = useMemo(() => {
			return allPlannables.filter(it => it.getField('scheduled.start').value === null)
		}, [allPlannables])

		const dates = useMemo(() => {
			const scheduledDateTimes = scheduledPlannables
				.map((it): [string, number] => [it.getField<string>('scheduled.start').value!, plannableToTrayItem.get(it)!.getField<number>('duration').value!])
				.map(([it, duration]): [Temporal.PlainDateTime, Temporal.Duration] => [Temporal.Instant.from(it).toZonedDateTimeISO(LOCAL_TIMEZONE).toPlainDateTime(), Temporal.Duration.from({minutes: duration})])
			const lastDate = scheduledDateTimes.reduce((acc, [curr, duration]) => {
				const date = curr.add(duration).toPlainDate()
				return Temporal.PlainDateTime.compare(acc, date) > 0 ? acc : date
			}, startDate).add(Temporal.Duration.from({days: 1}))
			const dates = [startDate]
			while (Temporal.PlainDateTime.compare(dates[dates.length - 1], lastDate) < 0) {
				dates.push(dates[dates.length - 1].add(Temporal.Duration.from({days: 1})))
			}
			return dates
		}, [startDate, scheduledPlannables])


		const atendeesGroupsAccessor = useEntityList('atendeesGroups');
		const atendeeGroups = useMemo(() => {
			const array = Array.from(atendeesGroupsAccessor);
			array.sort((a, b) => {
				if (a.getField<boolean>('regular').value! !== b.getField<boolean>('regular').value!) {
					return a.getField<boolean>('regular').value ? -1 : 1
				}
				return a.getField<string>('name').value!.localeCompare(b.getField<string>('name').value!)
			})
			return array // TODO: sort
		}, [atendeesGroupsAccessor])
		const sortedAttendeGroupIds = useMemo(() => {
			return atendeeGroups.map(it => it.id)
		}, [atendeeGroups])

		const createSegmentsForPlannable = useCallback((plannable: EntityAccessor, opts?: { start?: Temporal.PlainDateTime }): Segment[] => {
			const trayItem = plannableToTrayItem.get(plannable)!
			const start = opts?.start ?? Temporal.Instant.from(plannable.getField<string>('scheduled.start').value!).toZonedDateTimeISO(LOCAL_TIMEZONE).toPlainDateTime()
			const duration = Temporal.Duration.from({minutes: trayItem.getField<number>('duration').value!})
			const end = start.add(duration)

			const segmentsFromAtendeeGroups = groupNeighbours(
				Array.from(plannable.getEntityList('atendeeGroups'), it => sortedAttendeGroupIds.indexOf(it.id))
			)

			const dates = [start.toPlainDate()]
			while (!dates[dates.length - 1].equals(end)) {
				dates.push(dates[dates.length - 1].add(Temporal.Duration.from({days: 1})))
			}

			return segmentsFromAtendeeGroups.flatMap(atendeeGroups => dates.map((date, dateIndex) => {
				return {
					plannable,
					date,
					start: dateIndex === 0 ? start.toPlainTime() : null,
					end: dateIndex === dates.length - 1 ? end.toPlainTime() : null,
					atendeeGroups,
				}
			}))
		}, [plannableToTrayItem,])

		const segments = useMemo(() => {
			return scheduledPlannables.flatMap(it => createSegmentsForPlannable(it))
		}, [scheduledPlannables, createSegmentsForPlannable])


		const [draggingPlannable, setDraggingPlannable] = useState<{id: EntityId, widthRatio?: number} | null>(null)
		const [draggingPlannableStart, setDraggingPlannableStart] = useState<Temporal.PlainDateTime | null>(null)
		const shadowSegments = useMemo(() => {
			if (draggingPlannable === null || draggingPlannableStart === null) {
				return []
			}
			const plannable = allPlannables.find(it => it.id === draggingPlannable.id)!
			return createSegmentsForPlannable(plannable, { start: draggingPlannableStart })
		}, [draggingPlannable, draggingPlannableStart, allPlannables, createSegmentsForPlannable])


		const [earliestTime, latestTime] = useMemo(() => {
			const earliest = segments
				.flatMap((it): (Temporal.PlainTime | null)[] => [
					it.start,
					it.end,
					it.end?.subtract(Temporal.Duration.from({minutes: 15})) ?? null,
				])
				.filter((it): it is Temporal.PlainTime => it !== null)
				.reduce((acc, time) => {
					return Temporal.PlainTime.compare(acc, time) < 0 ? acc : time
				}, Temporal.PlainTime.from('08:00'))
				.round({roundingIncrement: 30, smallestUnit: 'minutes', roundingMode: 'floor'})

			const latest = segments
				.flatMap((it): (Temporal.PlainTime | null)[] => [
					it.start,
					it.start?.add(Temporal.Duration.from({minutes: 60})) ?? null,
					it.end,
				])
				.filter((it): it is Temporal.PlainTime => it !== null)
				.reduce((acc, time) => {
					return Temporal.PlainTime.compare(acc, time) > 0 ? acc : time
				}, Temporal.PlainTime.from('20:00'))
				.round({roundingIncrement: 30, smallestUnit: 'minutes'})
			return [earliest, latest]
		}, [segments])

		const dayLength = useMemo(() => {
			return earliestTime.until(latestTime)
		}, [earliestTime, latestTime])

		const timeLabels = useMemo(() => {
			const timeStep = widthScale > 2 ? 5 : widthScale >= 1.1 ? 15 : 30;
			const dayMinutes = dayLength.total({unit: 'minutes'})
			const labels = []
			for (let i = 0; i <= dayMinutes; i += timeStep) {
				labels.push(earliestTime.add({minutes: i}))
			}
			return labels
		}, [earliestTime, dayLength, widthScale])

		const [hoveringPlannable, setHoveringPlannable] = useState<EntityId | null>(null)
		const ref = useRef<HTMLDivElement>(null)

		const getDateTimeForPosition = useCallback(([clientX, clientY]: [number, number], minutesOffset: number = 0): Temporal.PlainDateTime | null => {
			for (const dayEl of ref.current?.querySelectorAll('.scheduleTable__day') ?? []) {
				const rect = dayEl.getBoundingClientRect()
				if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
					const day = Temporal.PlainDate.from(dayEl.getAttribute('data-date')!)
					const pixelsInMinutes = (10 / rect.width) * dayLength.total({unit: 'minutes'})
					// const alignTo = [5, 10, 30, 60].find(it => pixelsInMinutes <= it)
					const alignTo = 5
					const relativeX = (clientX - rect.left) / rect.width

					const time = earliestTime.add({minutes: Math.floor(relativeX * dayLength.total({unit: 'minutes'}) - minutesOffset)}).round({
						roundingIncrement: alignTo,
						smallestUnit: 'minutes',
						roundingMode: 'floor'
					})
					return day.toPlainDateTime(time)
				}
			}
			return null
		}, [ref, dayLength, earliestTime])

		const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
			if (e.dataTransfer.types.includes(MIME_TYPE) && draggingPlannable !== null) {
				e.preventDefault()
				const widthRatio = draggingPlannable.widthRatio ?? 0
				const plannable = allPlannables.find(it => it.id === draggingPlannable.id)!
				const trayItem = plannableToTrayItem.get(plannable)!
				const duration = Temporal.Duration.from({minutes: trayItem.getField<number>('duration').value!})
				const offset = duration.total({unit: 'minutes'}) * widthRatio
				setDraggingPlannableStart(getDateTimeForPosition([e.clientX, e.clientY], offset))
			}
		}, [setDraggingPlannableStart, earliestTime, draggingPlannable, allPlannables, plannableToTrayItem, getDateTimeForPosition])

		const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
			if (e.dataTransfer.types.includes(MIME_TYPE)) {
				e.preventDefault()
				if (draggingPlannable === null || draggingPlannableStart === null) {
					return
				}

				const plannable = allPlannables.find(it => it.id === draggingPlannable.id)!
				plannable.getField('scheduled.start').updateValue(draggingPlannableStart.toZonedDateTime(LOCAL_TIMEZONE).toInstant().toString())
				setDraggingPlannable(null)
				setDraggingPlannableStart(null)
			}
		}, [draggingPlannable, draggingPlannableStart, allPlannables, setDraggingPlannable, setDraggingPlannableStart])


		const onTrayDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
			if (e.dataTransfer.types.includes(MIME_TYPE)) {
				e.preventDefault()
				setDraggingPlannableStart(null)
			}
		}, [ref, setDraggingPlannableStart])

		const onTrayDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
			if (e.dataTransfer.types.includes(MIME_TYPE)) {
				e.preventDefault()
				if (draggingPlannable === null || draggingPlannableStart !== null) {
					return
				}

				const plannable = allPlannables.find(it => it.id === draggingPlannable.id)!
				plannable.getEntity('scheduled').deleteEntity()
				setDraggingPlannable(null)
				setDraggingPlannableStart(null)
			}
		}, [draggingPlannable, draggingPlannableStart, allPlannables, setDraggingPlannable, setDraggingPlannableStart])

		const [createStartTime, setCreateStartTime] = useState<[Temporal.PlainDateTime | null, EntityId] | null>(null)
		const creatingPlannable = useMemo(() => {
			return createStartTime !== null ? trayItems.getChildEntityById(createStartTime[1]) : null
		}, [trayItems, createStartTime])


		const onCreateTrayItem = useCallback(() => {
			const id = trayItems.createNewEntity().value
			setCreateStartTime([null, id])
		}, [trayItems, setCreateStartTime])

		const onClickToCreate = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
			const start = getDateTimeForPosition([e.clientX, e.clientY])
			if (!start) {
				return
			}
			const id = trayItems.createNewEntity().value
			setCreateStartTime([start, id])
		}, [trayItems, getDateTimeForPosition, setCreateStartTime])

		const onDialogDismiss = useCallback(() => {
			creatingPlannable?.deleteEntity()
			setCreateStartTime(null)
		}, [creatingPlannable, setCreateStartTime])

		const onDialogSave = useCallback(() => {
			if (createStartTime !== null) {
				const [time, id] = createStartTime
				const entity = trayItems.getChildEntityById(id)
				const startValue = time?.toZonedDateTime(LOCAL_TIMEZONE).toInstant().toString() ?? null;
				for (const plannable of entity.getEntityList('plannables')) {
					plannable.getField('scheduled.start').updateValue(startValue)
				}
				setCreateStartTime(null)
			}
		}, [createStartTime, trayItems])


		const [editingTrayItem, setEditingTrayItem] = useState<EntityId | null>(null)

		return (
			<div className="schedulePage scheme-light">
				<div className="schedulePage__mainContent">
					<div className="schedulePage__tableSegment">
						<div
							ref={ref}
							className="scheduleTable"
							style={{
								'--groups-count': atendeeGroups.length,
								'--days-count': dates.length,
								'--width-scale': widthScale,
							} as any}
							{...(editable ? {
								onDragOver: onDragOver,
								onDrop: onDrop,
								onClick: onClickToCreate,
							} : {})}
						>
							<div
								className="scheduleTable__actions"
							>
								{editable && (
									<>
										<div>
											<PersistButton size="small" flow="block" labelSave="Uložit" labelSaved="Uloženo" />
										</div>
										<LinkButton to="editSchedule(scheduleId:$request.scheduleId)" disabled={trayItems.hasUnpersistedChanges} distinction="outlined" size="small" flow="squarish"><Icon blueprintIcon="cog" /></LinkButton>
									</>
								)}
							</div>

							<DateLabels dates={dates} atendeeGroups={atendeeGroups} />

							<TimeLabels
								earliestTime={earliestTime}
								timeLabels={timeLabels}
								dayLength={dayLength}
							/>

							{[...segments].map((segment, index) => (
								<SegmentBox
									key={index}
									segment={segment}
									trayItem={plannableToTrayItem.get(segment.plannable)!}
									earliestTime={earliestTime}
									latestTime={latestTime}
									isHovering={hoveringPlannable === segment.plannable.id}
									isDragged={draggingPlannable?.id === segment.plannable.id}
									setHovering={isHovering => setHoveringPlannable(isHovering ? segment.plannable.id : null)}
									dayIndex={dates.findIndex(it => it.equals(segment.date))}
									onDragStart={(widthRatio) => {
										setDraggingPlannable({ id: segment.plannable.id, widthRatio })
									}}
									onDragEnd={() => {
										setDraggingPlannable(null)
										setDraggingPlannableStart(null)
									}}
									onClick={() => {
										setEditingTrayItem(plannableToTrayItem.get(segment.plannable)!.id)
									}}
									editable={editable}
								/>
							))}

							{...shadowSegments.map((segment, index) => (
								<SegmentBox
									key={index}
									segment={segment}
									trayItem={plannableToTrayItem.get(segment.plannable)!}
									earliestTime={earliestTime}
									latestTime={latestTime}
									isHovering={hoveringPlannable === segment.plannable.id}
									setHovering={isHovering => setHoveringPlannable(isHovering ? segment.plannable.id : null)}
									dayIndex={dates.findIndex(it => it.equals(segment.date))}
									onDragStart={(widthRatio) => {
										setDraggingPlannable({
											id: segment.plannable.id,
											widthRatio,
										})
									}}
									onDragEnd={() => {
										setDraggingPlannable(null)
										setDraggingPlannableStart(null)
									}}
									onClick={() => {
										setEditingTrayItem(plannableToTrayItem.get(segment.plannable)!.id)
									}}
									editable={editable}
								/>
							))}
						</div>
					</div>
					<div className="schedulePage__bottomControls">
						🔎
						<input type="range" min={1} max={3} step={0.1} value={widthScale} onChange={(e) => setWidthScale(parseFloat(e.target.value))} />
					</div>
				</div>



				{editable && (
					<div
						className="schedulePage__tray"
						onDragOver={onTrayDragOver}
						onDrop={onTrayDrop}
					>
						<div className="schedulePage_trayHeader">
							<h2 className="schedulePage_trayHeaderTitle">Zásobník</h2>
							<Button onClick={onCreateTrayItem} distinction="outlined" size="small" flow="squarish"><Icon blueprintIcon="plus" /></Button>
						</div>
						{/*<LinkButton to="tray(scheduleId: $request.scheduleId)" distinction="outlined" size="small">Přidat</LinkButton>*/}
						{notScheduledPlannables.map(plannable => {
							const trayItem = plannableToTrayItem.get(plannable)!;
							const color = trayItem.getField<string>('programmeGroup.color').value;
							const isDark = color !== null ? isColorDark(color) : false;
							return (
									<div
										className={classNames(
											'schedulePage__traySegment',
											isDark && 'schedulePage__traySegment--dark',
										)}
										style={{
											'--segment-color': color,
										} as any}

										draggable={true}
										onDragStart={(e) => {
											e.dataTransfer.setData(MIME_TYPE, plannable.id as string)
											e.dataTransfer.effectAllowed = "move"
											setDraggingPlannable({ id: plannable.id })
										}}
										onClick={() => {
											setEditingTrayItem(trayItem.id)
										}}
									>
										{trayItem.getField('title').value}
									</div>
								);
							}
						)}
					</div>
				)}


				{creatingPlannable && (
					<Dialog
						onDismiss={onDialogDismiss}
						onSubmit={onDialogSave}
						submitDisabled={!isTrayItemComplete(creatingPlannable)}
					>
						<Entity accessor={creatingPlannable}>
							<TrayItemForm />
						</Entity>
					</Dialog>
				)}

				{editingTrayItem && (
					<Dialog
						onDismiss={() => setEditingTrayItem(null)}
						onSubmit={() => setEditingTrayItem(null)}
						submitLabel="Zavřít"
					>
						<Entity accessor={trayItems.getChildEntityById(editingTrayItem)}>
							<TrayItemForm editable={editable} />
						</Entity>
					</Dialog>
				)}
			</div>
		)
	},
	() => (
		<>
			<Field field="startDate" />
			<HasMany field="atendeesGroups">
				<Field field="name" />
				<Field field="regular" />
			</HasMany>
			<HasMany field="trayItems">
				<TrayItemForm />
				<Field field="title" />
				<Field field="description" />
				<Field field="duration" />
				<Field field="programmeGroup.name" />
				<Field field="programmeGroup.color" />
				<HasMany field="plannables">
					<HasMany field="atendeeGroups" />
					<HasOne field="scheduled">
						<Field field="start" />
					</HasOne>
				</HasMany>
			</HasMany>
		</>
	),
)
