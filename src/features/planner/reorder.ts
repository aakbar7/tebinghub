export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
	if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
		return [...list];
	}

	const next = [...list];
	const [moved] = next.splice(from, 1);
	if (moved === undefined) return next;
	next.splice(to, 0, moved);
	return next;
}

export function afterStopIdForMove(stops: readonly { id: string }[], from: number, to: number): string | undefined {
	const next = moveItem(stops, from, to);
	if (to === 0) return undefined;
	return next[to - 1]?.id;
}
