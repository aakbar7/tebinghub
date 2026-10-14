"use client";

import { ArrowRightIcon, CheckCircleIcon, SparkleIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useAction, useMutation } from "convex/react";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Locale, RouteDuration } from "@/domain";
import { MAX_AI_MESSAGE_LENGTH } from "@/domain/ai-ops";
import { getAiErrorCode } from "@/features/planner/ai-error";
import { getOrCreateDeviceKey } from "@/features/planner/device-key";
import { cn } from "@/lib/cn";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const copy = {
	id: {
		eyebrow: "Bantuan AI",
		title: "Mau rute yang lebih pas?",
		description:
			"Ceritakan tempat, suasana, atau waktu yang kamu punya. AI menyusun rute dari daftar tempat yang tersedia, lalu kamu bisa menyuntingnya bersama.",
		fieldLabel: "Ceritakan rute yang kamu inginkan",
		placeholder: "Contoh: dua jam, ingin lemang dan tempat yang teduh",
		submit: "Susun dengan AI",
		busy: "AI sedang menyusun…",
		success: "Rute siap. Membuka editor…",
		shortcut: "Kirim dengan Ctrl/Command + Enter.",
		validationRequired: "Tulis kebutuhan rute terlebih dahulu.",
		hint: "Rute dibuat sebagai rencana bersama yang bisa dibagikan.",
		createError: "Rencana belum bisa dibuat. Coba lagi sebentar.",
		retry: "Coba lagi",
		manual: "Lanjut sunting manual",
		errors: {
			RATE_LIMITED: "Jatah bantuan AI sementara sudah habis. Coba lagi nanti atau lanjut sunting manual.",
			PROVIDER_TIMEOUT: "Layanan AI terlalu lama merespons. Coba lagi atau lanjut sunting manual.",
			PROVIDER_RATE_LIMITED: "Layanan AI sedang sibuk. Coba lagi atau lanjut sunting manual.",
			PROVIDER_UNAVAILABLE: "Bantuan AI belum siap. Coba lagi atau lanjut sunting manual.",
			MODEL_RESPONSE_INVALID: "Respons AI tidak dapat dipakai. Coba lagi atau lanjut sunting manual.",
			MODEL_LANGUAGE_DRIFT: "Respons AI tidak valid. Coba lagi atau lanjut sunting manual.",
			NO_APPLICABLE_CHANGE: "Permintaan belum bisa diterapkan dari katalog saat ini. Coba lagi atau sunting manual.",
			VERSION_CONFLICT: "Rencana berubah. Coba lagi atau lanjut sunting manual.",
			CONFIGURATION_ERROR:
				"Bantuan AI belum tersedia karena belum dikonfigurasi. Kamu tetap bisa menyunting rute secara manual.",
			GENERIC: "Bantuan AI belum berhasil. Coba lagi atau lanjut sunting manual.",
		},
	},
	en: {
		eyebrow: "AI help",
		title: "Want a route that fits better?",
		description:
			"Share the places, mood, or time you have. AI builds a route from the available places, and you can edit it together afterwards.",
		fieldLabel: "Describe the route you want",
		placeholder: "Example: two hours, with lemang and somewhere shaded",
		submit: "Plan with AI",
		busy: "AI is planning…",
		success: "Route ready. Opening the editor…",
		shortcut: "Submit with Ctrl/Command + Enter.",
		validationRequired: "Describe the route you need first.",
		hint: "The route is created as a shareable collaborative plan.",
		createError: "The plan could not be created. Try again in a moment.",
		retry: "Try again",
		manual: "Continue editing manually",
		errors: {
			RATE_LIMITED: "AI budget is temporarily exhausted. Try again later or continue editing manually.",
			PROVIDER_TIMEOUT: "AI help took too long. Try again or continue editing manually.",
			PROVIDER_RATE_LIMITED: "The AI provider is busy. Try again or continue editing manually.",
			PROVIDER_UNAVAILABLE: "AI help is unavailable. Try again or continue editing manually.",
			MODEL_RESPONSE_INVALID: "The AI response could not be used. Try again or continue editing manually.",
			MODEL_LANGUAGE_DRIFT: "The AI response was invalid. Try again or continue editing manually.",
			NO_APPLICABLE_CHANGE: "That request could not be applied from the current catalog. Try again or edit manually.",
			VERSION_CONFLICT: "The plan changed. Try again or continue editing manually.",
			CONFIGURATION_ERROR: "AI help is unavailable because it has not been configured. You can still edit manually.",
			GENERIC: "AI help did not succeed. Try again or continue editing manually.",
		},
	},
} as const;

type PendingDraft = {
	planId: Id<"plans">;
	editToken: string;
	version: number;
};

type StopoverConciergeProps = {
	locale: Locale;
	duration: RouteDuration;
};

type ConciergePhase = "idle" | "validation" | "submitting" | "success" | "error";

function mapAiError(code: ReturnType<typeof getAiErrorCode>, labels: (typeof copy)["id"] | (typeof copy)["en"]) {
	switch (code) {
		case "RATE_LIMITED":
			return labels.errors.RATE_LIMITED;
		case "PROVIDER_TIMEOUT":
			return labels.errors.PROVIDER_TIMEOUT;
		case "PROVIDER_RATE_LIMITED":
			return labels.errors.PROVIDER_RATE_LIMITED;
		case "PROVIDER_UNAVAILABLE":
			return labels.errors.PROVIDER_UNAVAILABLE;
		case "MODEL_RESPONSE_INVALID":
			return labels.errors.MODEL_RESPONSE_INVALID;
		case "MODEL_LANGUAGE_DRIFT":
			return labels.errors.MODEL_LANGUAGE_DRIFT;
		case "NO_APPLICABLE_CHANGE":
			return labels.errors.NO_APPLICABLE_CHANGE;
		case "VERSION_CONFLICT":
			return labels.errors.VERSION_CONFLICT;
		case "CONFIGURATION_ERROR":
			return labels.errors.CONFIGURATION_ERROR;
		default:
			return labels.errors.GENERIC;
	}
}

export function StopoverConcierge({ locale, duration }: StopoverConciergeProps) {
	const labels = copy[locale];
	const createPlan = useMutation(api.plans.createPlan);
	const reviseWithAi = useAction(api.ai.reviseWithAi);
	const [message, setMessage] = useState("");
	const [phase, setPhase] = useState<ConciergePhase>("idle");
	const [touched, setTouched] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const redirectTimerRef = useRef<number | null>(null);
	const busy = phase === "submitting";
	const locked = busy || phase === "success";

	useEffect(
		() => () => {
			if (redirectTimerRef.current !== null) window.clearTimeout(redirectTimerRef.current);
		},
		[],
	);

	function editorHref(draft: PendingDraft) {
		const prefix = locale === "en" ? "/en" : "";
		return `${prefix}/rencana/${draft.planId}#edit=${draft.editToken}`;
	}

	function continueManually(draft: PendingDraft) {
		window.location.assign(editorHref(draft));
	}

	async function reviseDraft(draft: PendingDraft, trimmed: string) {
		const result = await reviseWithAi({
			planId: draft.planId,
			editToken: draft.editToken,
			expectedVersion: draft.version,
			message: trimmed,
			deviceKey: getOrCreateDeviceKey(),
		});
		setStatus(labels.success);
		setPhase("success");
		redirectTimerRef.current = window.setTimeout(() => {
			redirectTimerRef.current = null;
			window.location.assign(editorHref({ ...draft, version: result.plan.version }));
		}, 450);
	}

	async function handleSubmit() {
		const trimmed = message.trim();
		if (locked) return;
		if (!trimmed) {
			setTouched(true);
			setValidationError(labels.validationRequired);
			setPhase("validation");
			return;
		}
		setPhase("submitting");
		setError(null);
		setValidationError(null);
		setStatus(labels.busy);

		try {
			let draft = pendingDraft;
			if (!draft) {
				try {
					const created = await createPlan({
						duration,
						locale,
						deviceKey: getOrCreateDeviceKey(),
					});
					draft = {
						planId: created.planId,
						editToken: created.editToken,
						version: created.version,
					};
					setPendingDraft(draft);
				} catch {
					setError(labels.createError);
					setStatus(null);
					setPhase("error");
					return;
				}
			}

			try {
				await reviseDraft(draft, trimmed);
			} catch (caught) {
				const code = getAiErrorCode(caught);
				setError(mapAiError(code, labels));
				setStatus(null);
				setPhase("error");
			}
		} catch {
			setError(labels.errors.GENERIC);
			setStatus(null);
			setPhase("error");
		}
	}

	function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void handleSubmit();
	}

	function handleRequestKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;
		event.preventDefault();
		void handleSubmit();
	}

	function validateMessage(value: string) {
		const nextError = value.trim() ? null : labels.validationRequired;
		setValidationError(nextError);
		if (nextError) setPhase("validation");
		else if (phase === "validation") setPhase("idle");
	}

	return (
		<div className="mt-7 grid gap-10 lg:grid-cols-12 lg:gap-14" id="concierge">
			<div className="lg:col-span-5">
				<p
					className="flex items-center gap-2.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-river-bright"
					data-panel-item
				>
					<SparkleIcon aria-hidden="true" className="text-emas" size={16} weight="fill" />
					{labels.eyebrow}
				</p>
				<h3
					className="mt-3 max-w-[24ch] font-display text-[clamp(1.75rem,2.4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.03em] text-ink"
					data-panel-item
				>
					{labels.title}
				</h3>
				<p className="mt-7 flex max-w-md gap-3 text-sm leading-6 text-ink-muted" data-panel-item>
					<span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rotate-45 bg-emas" />
					{labels.description}
				</p>
			</div>

			<form
				aria-busy={busy}
				aria-label={labels.eyebrow}
				className="lg:col-span-7"
				data-panel-item
				data-state={validationError ? "validation" : phase}
				onSubmit={handleFormSubmit}
			>
				<label className="block text-sm font-bold text-river" htmlFor="concierge-request">
					{labels.fieldLabel}
				</label>
				<div
					className={cn(
						"mt-3 border bg-paper transition-[border-color,box-shadow] duration-200 focus-within:border-river focus-within:ring-2 focus-within:ring-emas/70",
						validationError || error ? "border-marwah/70" : "border-river/30 hover:border-river/50",
						phase === "success" && "border-river bg-mist/25",
					)}
				>
					<textarea
						aria-describedby="concierge-request-help concierge-request-validation"
						aria-invalid={validationError ? "true" : "false"}
						className="min-h-36 w-full resize-y bg-transparent px-4 py-4 text-base leading-7 text-ink placeholder:text-ink-muted outline-none disabled:cursor-wait disabled:opacity-65"
						disabled={locked}
						id="concierge-request"
						maxLength={MAX_AI_MESSAGE_LENGTH}
						onBlur={() => {
							setTouched(true);
							validateMessage(message);
						}}
						onChange={(event) => {
							setMessage(event.target.value);
							if (touched) validateMessage(event.target.value);
						}}
						onKeyDown={handleRequestKeyDown}
						placeholder={labels.placeholder}
						value={message}
					/>
					<div className="flex flex-col gap-4 border-t border-river/20 bg-paper-deep/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0 text-xs leading-5 text-ink-muted" id="concierge-request-help">
							<p>{labels.shortcut}</p>
							<p>{labels.hint}</p>
						</div>
						<button
							className="inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-3 bg-emas px-6 text-sm font-bold text-ink transition-[background-color,transform] hover:bg-[#e2b644] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas sm:w-auto"
							disabled={locked || message.trim().length === 0}
							type="submit"
						>
							{busy ? labels.busy : phase === "success" ? labels.success : labels.submit}
							{busy ? (
								<SpinnerGapIcon aria-hidden="true" className="motion-safe:animate-spin" size={18} weight="bold" />
							) : phase === "success" ? (
								<CheckCircleIcon aria-hidden="true" size={18} weight="fill" />
							) : (
								<ArrowRightIcon aria-hidden="true" size={17} weight="bold" />
							)}
						</button>
					</div>
				</div>
				{validationError ? (
					<p
						className="mt-3 flex items-center gap-2 text-sm text-marwah"
						id="concierge-request-validation"
						role="alert"
					>
						<WarningCircleIcon aria-hidden="true" size={17} weight="fill" />
						{validationError}
					</p>
				) : (
					<span id="concierge-request-validation" />
				)}
				{status ? (
					<p aria-live="polite" className="mt-3 flex items-center gap-2 text-sm font-semibold text-river" role="status">
						{phase === "success" ? <CheckCircleIcon aria-hidden="true" size={18} weight="fill" /> : null}
						{status}
					</p>
				) : null}
				{error ? (
					<div className="mt-3 space-y-3 border-t border-marwah/20 pt-3">
						<p className="flex items-start gap-2 text-sm leading-6 text-marwah" role="alert">
							<WarningCircleIcon aria-hidden="true" className="mt-1 shrink-0" size={17} weight="fill" />
							{error}
						</p>
						{pendingDraft ? (
							<div className="flex flex-wrap gap-3">
								<button
									className="min-h-11 cursor-pointer border border-river bg-river px-4 text-sm font-bold text-paper disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
									disabled={busy}
									onClick={() => void handleSubmit()}
									type="button"
								>
									{labels.retry}
								</button>
								<button
									className="min-h-11 cursor-pointer border border-river/30 bg-paper px-4 text-sm font-bold text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
									disabled={busy}
									onClick={() => continueManually(pendingDraft)}
									type="button"
								>
									{labels.manual}
								</button>
							</div>
						) : null}
					</div>
				) : null}
			</form>
		</div>
	);
}
