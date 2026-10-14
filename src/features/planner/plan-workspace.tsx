"use client";

import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { plannerPoiCatalog, poiCatalog } from "@/content/catalog";
import type { Locale } from "@/domain";
import { PlanCopilot } from "@/features/planner/plan-copilot";
import { afterStopIdForMove, moveItem } from "@/features/planner/reorder";
import { buildPlanAtlasHref, readEditTokenFromHash } from "@/features/planner/share";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { api } from "../../../convex/_generated/api";

const poiById = new Map(poiCatalog.map((poi) => [poi.id, poi]));

type PlanWorkspaceProps = {
	planId: string;
	locale: Locale;
};

type DragSession = {
	pointerId: number;
	from: number;
	to: number;
	stopId: string;
};

const copy = {
	id: {
		loading: "Memuat rencana…",
		missing: "Rencana ini tidak ditemukan.",
		viewerMode: "Mode lihat",
		editorMode: "Mode sunting",
		viewerHint: "Kamu melihat rencana bersama. Minta tautan sunting untuk mengubah urutan.",
		editorHint: "Bagikan tautan lihat untuk teman. Simpan tautan sunting ini untuk dirimu.",
		stops: "Urutan singgah",
		addStop: "Tambah tempat",
		add: "Tambah",
		remove: "Hapus",
		dragToReorder: "Geser urutan",
		minutes: "mnt",
		copyViewer: "Salin tautan lihat",
		copyEditor: "Salin tautan sunting",
		copied: "Tersalin",
		openMap: "Buka di atlas",
		titleLabel: "Judul rencana",
		saveTitle: "Simpan judul",
		error: "Perubahan belum tersimpan. Muat ulang lalu coba lagi.",
		available: "Tempat yang bisa ditambah",
	},
	en: {
		loading: "Loading plan…",
		missing: "This plan could not be found.",
		viewerMode: "Viewing",
		editorMode: "Editing",
		viewerHint: "You are viewing a shared plan. Ask for the edit link to change the order.",
		editorHint: "Share the view link with friends. Keep the edit link for yourself.",
		stops: "Stop order",
		addStop: "Add a place",
		add: "Add",
		remove: "Remove",
		dragToReorder: "Drag to reorder",
		minutes: "min",
		copyViewer: "Copy view link",
		copyEditor: "Copy edit link",
		copied: "Copied",
		openMap: "Open in atlas",
		titleLabel: "Plan title",
		saveTitle: "Save title",
		error: "Changes could not be saved. Refresh and try again.",
		available: "Places you can add",
	},
} as const;

function stopIndexFromClientY(list: HTMLOListElement | null, clientY: number): number {
	if (!list) return 0;
	const rows = [...list.querySelectorAll<HTMLElement>("[data-stop-row]")];
	if (rows.length === 0) return 0;
	for (let index = 0; index < rows.length; index += 1) {
		const row = rows[index];
		if (!row) continue;
		const rect = row.getBoundingClientRect();
		if (clientY < rect.top + rect.height / 2) return index;
	}
	return rows.length - 1;
}

export function PlanWorkspace({ planId, locale }: PlanWorkspaceProps) {
	const labels = copy[locale];
	const plan = useQuery(api.plans.getPlan, { planId });
	const addStop = useMutation(api.plans.addStop);
	const removeStop = useMutation(api.plans.removeStop);
	const reorderStop = useMutation(api.plans.reorderStop);
	const setStopDuration = useMutation(api.plans.setStopDuration);
	const updateTitle = useMutation(api.plans.updateTitle);
	const listRef = useRef<HTMLOListElement>(null);
	const overlayVersionRef = useRef<number | null>(null);

	const [editToken, setEditToken] = useState<string | undefined>(() =>
		typeof window === "undefined" ? undefined : readEditTokenFromHash(window.location.hash),
	);
	const [titleDraft, setTitleDraft] = useState("");
	const [selectedPoi, setSelectedPoi] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<"viewer" | "editor" | null>(null);
	const [drag, setDrag] = useState<DragSession | null>(null);
	const [overlayIds, setOverlayIds] = useState<string[] | null>(null);

	useEffect(() => {
		const syncToken = () => setEditToken(readEditTokenFromHash(window.location.hash));
		syncToken();
		window.addEventListener("hashchange", syncToken);
		return () => window.removeEventListener("hashchange", syncToken);
	}, []);

	useEffect(() => {
		if (plan?.title) setTitleDraft(plan.title);
	}, [plan?.title]);

	useEffect(() => {
		if (!overlayIds || !plan) return;
		const live = plan.stops.map((stop) => stop.id);
		const matches = live.length === overlayIds.length && live.every((id, index) => id === overlayIds[index]);
		if (matches || overlayVersionRef.current !== plan.version) {
			setOverlayIds(null);
			overlayVersionRef.current = null;
		}
	}, [overlayIds, plan]);

	const canEdit = Boolean(editToken);
	const usedPoiIds = useMemo(() => new Set(plan?.stops.map((stop) => stop.poiId) ?? []), [plan?.stops]);
	const availablePois = plannerPoiCatalog.filter((poi) => !usedPoiIds.has(poi.id));
	const displayStops = useMemo(() => {
		if (!plan) return [];
		if (overlayIds) {
			const byId = new Map(plan.stops.map((stop) => [stop.id, stop]));
			return overlayIds.flatMap((id) => {
				const stop = byId.get(id);
				return stop ? [stop] : [];
			});
		}
		if (drag) return moveItem(plan.stops, drag.from, drag.to);
		return plan.stops;
	}, [drag, overlayIds, plan]);

	async function runEdit(action: (token: string, version: number) => Promise<unknown>) {
		if (!plan || !editToken) return;
		setBusy(true);
		setError(null);
		try {
			await action(editToken, plan.version);
		} catch {
			setError(labels.error);
			setOverlayIds(null);
			overlayVersionRef.current = null;
		} finally {
			setBusy(false);
		}
	}

	function commitReorder(from: number, to: number) {
		if (!plan || from === to) return;
		const next = moveItem(plan.stops, from, to);
		overlayVersionRef.current = plan.version;
		setOverlayIds(next.map((stop) => stop.id));
		void runEdit((token, version) =>
			reorderStop({
				planId: plan.id,
				editToken: token,
				expectedVersion: version,
				stopId: plan.stops[from]?.id ?? "",
				afterStopId: afterStopIdForMove(plan.stops, from, to),
			}),
		);
	}

	async function copyLink(kind: "viewer" | "editor") {
		const url = new URL(window.location.href);
		if (kind === "viewer") {
			url.hash = "";
		} else if (editToken) {
			url.hash = `edit=${editToken}`;
		}
		await navigator.clipboard.writeText(url.toString());
		setCopied(kind);
		window.setTimeout(() => setCopied(null), 1600);
	}

	if (plan === undefined) {
		return <p className="text-ink-muted">{labels.loading}</p>;
	}

	if (plan === null) {
		return <p className="text-marwah">{labels.missing}</p>;
	}

	const atlasHref = buildPlanAtlasHref({
		planId: plan.id,
		poiIds: plan.stops.map((stop) => stop.poiId),
		firstPoiId: plan.stops[0]?.poiId,
	});
	const canReorder = canEdit && !busy && !overlayIds && plan.stops.length >= 2;

	return (
		<div className="space-y-10" data-plan-mode={canEdit ? "editor" : "viewer"}>
			<div className="flex flex-wrap items-end justify-between gap-4 border-b border-river/15 pb-6">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.18em] text-river-bright">
						{canEdit ? labels.editorMode : labels.viewerMode}
					</p>
					{canEdit ? (
						<div className="mt-4 flex flex-wrap items-end gap-3">
							<label className="block min-w-[16rem] flex-1">
								<span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-marwah">
									{labels.titleLabel}
								</span>
								<input
									className="mt-2 w-full border-b border-river/25 bg-transparent py-2 font-display text-3xl font-medium tracking-[-0.04em] text-ink outline-none focus:border-emas"
									onChange={(event) => setTitleDraft(event.target.value)}
									value={titleDraft}
								/>
							</label>
							<button
								className="min-h-11 border border-river/20 px-4 text-sm font-bold text-river focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas disabled:opacity-60"
								disabled={busy || titleDraft.trim() === plan.title}
								onClick={() =>
									void runEdit((token, version) =>
										updateTitle({
											planId: plan.id,
											editToken: token,
											expectedVersion: version,
											title: titleDraft,
										}),
									)
								}
								type="button"
							>
								{labels.saveTitle}
							</button>
						</div>
					) : (
						<h1 className="mt-3 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.04em] text-river">
							{plan.title}
						</h1>
					)}
					<p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
						{canEdit ? labels.editorHint : labels.viewerHint}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<button
						className="inline-flex min-h-11 items-center border border-river/20 px-4 text-sm font-bold text-river focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
						onClick={() => void copyLink("viewer")}
						type="button"
					>
						{copied === "viewer" ? labels.copied : labels.copyViewer}
					</button>
					{canEdit ? (
						<button
							className="inline-flex min-h-11 items-center border border-river/20 px-4 text-sm font-bold text-river focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							onClick={() => void copyLink("editor")}
							type="button"
						>
							{copied === "editor" ? labels.copied : labels.copyEditor}
						</button>
					) : null}
					<Link
						className="inline-flex min-h-11 items-center border border-river bg-river px-4 text-sm font-bold text-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
						href={atlasHref}
					>
						{labels.openMap}
					</Link>
				</div>
			</div>

			<section aria-labelledby="plan-stops-heading">
				<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-marwah" id="plan-stops-heading">
					{labels.stops}
				</h2>
				<ol
					className={cn(
						"mt-5 divide-y divide-river/10 border-y border-river/15",
						drag && "cursor-grabbing select-none",
					)}
					ref={listRef}
				>
					{displayStops.map((stop, index) => {
						const poi = poiById.get(stop.poiId as never);
						const sourceIndex = plan.stops.findIndex((item) => item.id === stop.id);
						const isLifted = drag?.stopId === stop.id;
						return (
							<li
								className={cn(
									"grid gap-4 py-5 sm:items-center",
									canEdit ? "sm:grid-cols-[2.5rem_2rem_1fr_auto]" : "sm:grid-cols-[2rem_1fr_auto]",
									isLifted && "bg-mist shadow-[0_8px_24px_rgb(21_24_22_/_0.14)] motion-safe:transition-shadow",
								)}
								data-stop-row
								key={stop.id}
							>
								{canEdit ? (
									<button
										aria-label={labels.dragToReorder}
										className={cn(
											"inline-flex min-h-10 min-w-10 touch-none items-center justify-center text-river focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas disabled:opacity-40",
											drag?.stopId === stop.id ? "cursor-grabbing" : "cursor-grab",
										)}
										disabled={!canReorder}
										onKeyDown={(event) => {
											if (event.key === "ArrowUp") {
												event.preventDefault();
												if (sourceIndex > 0) commitReorder(sourceIndex, sourceIndex - 1);
											}
											if (event.key === "ArrowDown") {
												event.preventDefault();
												if (sourceIndex >= 0 && sourceIndex < plan.stops.length - 1) {
													commitReorder(sourceIndex, sourceIndex + 1);
												}
											}
										}}
										onPointerCancel={(event) => {
											if (drag?.pointerId !== event.pointerId) return;
											if (event.currentTarget.hasPointerCapture(event.pointerId)) {
												event.currentTarget.releasePointerCapture(event.pointerId);
											}
											setDrag(null);
										}}
										onPointerDown={(event) => {
											if (!canReorder || event.button !== 0 || sourceIndex < 0) return;
											event.preventDefault();
											event.currentTarget.setPointerCapture(event.pointerId);
											setDrag({ pointerId: event.pointerId, from: sourceIndex, to: sourceIndex, stopId: stop.id });
										}}
										onPointerMove={(event) => {
											if (!drag || event.pointerId !== drag.pointerId) return;
											const to = stopIndexFromClientY(listRef.current, event.clientY);
											if (to !== drag.to) setDrag({ ...drag, to });
										}}
										onPointerUp={(event) => {
											if (!drag || event.pointerId !== drag.pointerId) return;
											if (event.currentTarget.hasPointerCapture(event.pointerId)) {
												event.currentTarget.releasePointerCapture(event.pointerId);
											}
											const { from, to } = drag;
											setDrag(null);
											commitReorder(from, to);
										}}
										type="button"
									>
										<DotsSixVerticalIcon aria-hidden="true" size={18} weight="bold" />
									</button>
								) : null}
								<span className="font-display text-2xl text-river-bright">{index + 1}</span>
								<div>
									<p className="font-semibold text-ink">{poi?.name[locale] ?? stop.poiId}</p>
									{canEdit ? (
										<label className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted">
											<input
												className="w-20 border-b border-river/25 bg-transparent py-1 tabular-nums outline-none focus:border-emas"
												defaultValue={stop.visitDurationMinutes}
												disabled={busy}
												key={`${stop.id}-${stop.visitDurationMinutes}`}
												max={240}
												min={5}
												onBlur={(event) => {
													const value = Number(event.target.value);
													if (!Number.isFinite(value) || value === stop.visitDurationMinutes) return;
													void runEdit((token, version) =>
														setStopDuration({
															planId: plan.id,
															editToken: token,
															expectedVersion: version,
															stopId: stop.id,
															visitDurationMinutes: value,
														}),
													);
												}}
												type="number"
											/>
											{labels.minutes}
										</label>
									) : (
										<p className="mt-1 text-sm tabular-nums text-ink-muted">
											{stop.visitDurationMinutes} {labels.minutes}
										</p>
									)}
								</div>
								{canEdit ? (
									<div className="flex flex-wrap gap-2">
										<button
											className="min-h-10 border border-marwah/30 px-3 text-sm font-bold text-marwah disabled:opacity-40"
											disabled={busy || plan.stops.length <= 1}
											onClick={() =>
												void runEdit((token, version) =>
													removeStop({
														planId: plan.id,
														editToken: token,
														expectedVersion: version,
														stopId: stop.id,
													}),
												)
											}
											type="button"
										>
											{labels.remove}
										</button>
									</div>
								) : null}
							</li>
						);
					})}
				</ol>
			</section>

			{canEdit && availablePois.length > 0 ? (
				<section aria-labelledby="plan-add-heading" className="border-t border-river/15 pt-8">
					<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-marwah" id="plan-add-heading">
						{labels.addStop}
					</h2>
					<p className="mt-2 text-sm text-ink-muted">{labels.available}</p>
					<div className="mt-4 flex flex-wrap gap-3">
						<select
							className="min-h-11 min-w-[16rem] flex-1 border border-river/20 bg-paper px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							onChange={(event) => setSelectedPoi(event.target.value)}
							value={selectedPoi}
						>
							<option value="">{labels.addStop}</option>
							{availablePois.map((poi) => (
								<option key={poi.id} value={poi.id}>
									{poi.name[locale]}
								</option>
							))}
						</select>
						<button
							className="min-h-11 border border-river bg-river px-4 text-sm font-bold text-paper disabled:opacity-50"
							disabled={busy || !selectedPoi}
							onClick={() => {
								if (!selectedPoi) return;
								void runEdit(async (token, version) => {
									await addStop({
										planId: plan.id,
										editToken: token,
										expectedVersion: version,
										poiId: selectedPoi,
									});
									setSelectedPoi("");
								});
							}}
							type="button"
						>
							{labels.add}
						</button>
					</div>
				</section>
			) : null}

			{canEdit && editToken ? (
				<PlanCopilot editToken={editToken} expectedVersion={plan.version} locale={locale} planId={plan.id} />
			) : null}

			{error ? (
				<p className="text-sm text-marwah" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
