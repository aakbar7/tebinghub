"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import type { Locale } from "@/domain";
import { MAX_AI_MESSAGE_LENGTH } from "@/domain/ai-ops";
import { getAiErrorCode } from "@/features/planner/ai-error";
import { getOrCreateDeviceKey } from "@/features/planner/device-key";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type PlanCopilotProps = {
	planId: Id<"plans">;
	editToken: string;
	expectedVersion: number;
	locale: Locale;
};

const copy = {
	id: {
		eyebrow: "Bantuan AI",
		title: "Revisi rencana dengan bantuan",
		description: "Minta penyesuaian dari katalog curated saja. Tidak bisa menambah tempat di luar daftar.",
		placeholder: "Contoh: lebih ramah keluarga, tambahkan taman, kurangi waktu kopi",
		submit: "Terapkan saran",
		busy: "Menyusun ulang…",
		success: "Perubahan diterapkan.",
		errors: {
			RATE_LIMITED: "Batas AI sementara tercapai. Coba lagi nanti.",
			PROVIDER_TIMEOUT: "Bantuan AI terlalu lama merespons. Coba lagi.",
			PROVIDER_RATE_LIMITED: "Penyedia AI sedang sibuk. Coba lagi sebentar.",
			PROVIDER_UNAVAILABLE: "Bantuan AI belum siap. Coba lagi atau sunting manual.",
			MODEL_RESPONSE_INVALID: "Respons AI tidak dapat dipakai. Coba lagi atau sunting manual.",
			MODEL_LANGUAGE_DRIFT: "Respons AI tidak valid. Coba lagi atau sunting manual.",
			NO_APPLICABLE_CHANGE: "Permintaan belum bisa diterapkan dari katalog saat ini.",
			VERSION_CONFLICT: "Rencana berubah. Muat ulang lalu coba lagi.",
			GENERIC: "Saran belum bisa diterapkan. Coba lagi atau sunting manual.",
		},
	},
	en: {
		eyebrow: "AI help",
		title: "Revise the plan with help",
		description: "Ask for adjustments from the curated catalog only. It cannot invent places outside the list.",
		placeholder: "Example: more family-friendly, add the park, shorten coffee stops",
		submit: "Apply suggestion",
		busy: "Revising…",
		success: "Changes applied.",
		errors: {
			RATE_LIMITED: "AI budget is temporarily exhausted. Try again later.",
			PROVIDER_TIMEOUT: "AI help took too long. Try again.",
			PROVIDER_RATE_LIMITED: "The AI provider is busy. Try again in a moment.",
			PROVIDER_UNAVAILABLE: "AI help is unavailable. Try again or edit manually.",
			MODEL_RESPONSE_INVALID: "The AI response could not be used. Try again or edit manually.",
			MODEL_LANGUAGE_DRIFT: "The AI response was invalid. Try again or edit manually.",
			NO_APPLICABLE_CHANGE: "That request could not be applied from the current catalog.",
			VERSION_CONFLICT: "The plan changed. Refresh and try again.",
			GENERIC: "The suggestion could not be applied. Try again or edit manually.",
		},
	},
} as const;

function messageFromError(error: unknown, labels: (typeof copy)["id"] | (typeof copy)["en"]) {
	const code = getAiErrorCode(error);
	switch (code) {
		case "RATE_LIMITED":
			return labels.errors.RATE_LIMITED;
		case "PROVIDER_TIMEOUT":
			return labels.errors.PROVIDER_TIMEOUT;
		case "PROVIDER_RATE_LIMITED":
			return labels.errors.PROVIDER_RATE_LIMITED;
		case "PROVIDER_UNAVAILABLE":
		case "CONFIGURATION_ERROR":
			return labels.errors.PROVIDER_UNAVAILABLE;
		case "MODEL_RESPONSE_INVALID":
			return labels.errors.MODEL_RESPONSE_INVALID;
		case "MODEL_LANGUAGE_DRIFT":
			return labels.errors.MODEL_LANGUAGE_DRIFT;
		case "NO_APPLICABLE_CHANGE":
			return labels.errors.NO_APPLICABLE_CHANGE;
		case "VERSION_CONFLICT":
			return labels.errors.VERSION_CONFLICT;
		default:
			return labels.errors.GENERIC;
	}
}

export function PlanCopilot({ planId, editToken, expectedVersion, locale }: PlanCopilotProps) {
	const labels = copy[locale];
	const reviseWithAi = useAction(api.ai.reviseWithAi);
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit() {
		const trimmed = message.trim();
		if (!trimmed || busy) return;
		setBusy(true);
		setError(null);
		setStatus(null);
		try {
			const result = await reviseWithAi({
				planId,
				editToken,
				expectedVersion,
				message: trimmed,
				deviceKey: getOrCreateDeviceKey(),
			});
			setStatus(`${labels.success} (${result.operations.length})`);
			setMessage("");
		} catch (caught) {
			setError(messageFromError(caught, labels));
		} finally {
			setBusy(false);
		}
	}

	return (
		<section
			aria-labelledby="plan-copilot-heading"
			className="border-t border-river/15 pt-8"
			data-plan-copilot="editor"
		>
			<p className="text-xs font-bold uppercase tracking-[0.18em] text-river-bright">{labels.eyebrow}</p>
			<h2 className="mt-3 font-display text-3xl font-medium tracking-[-0.04em] text-river" id="plan-copilot-heading">
				{labels.title}
			</h2>
			<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{labels.description}</p>
			<label className="mt-5 block">
				<span className="sr-only">{labels.placeholder}</span>
				<textarea
					className="min-h-28 w-full border border-river/20 bg-paper px-4 py-3 text-sm leading-6 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
					disabled={busy}
					maxLength={MAX_AI_MESSAGE_LENGTH}
					onChange={(event) => setMessage(event.target.value)}
					placeholder={labels.placeholder}
					value={message}
				/>
			</label>
			<div className="mt-3 flex flex-wrap items-center gap-3">
				<button
					className="min-h-11 border border-river bg-river px-4 text-sm font-bold text-paper disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
					disabled={busy || message.trim().length === 0}
					onClick={() => void handleSubmit()}
					type="button"
				>
					{busy ? labels.busy : labels.submit}
				</button>
				{status ? (
					<p aria-live="polite" className="text-sm text-river" role="status">
						{status}
					</p>
				) : null}
				{error ? (
					<p className="text-sm text-marwah" role="alert">
						{error}
					</p>
				) : null}
			</div>
		</section>
	);
}
