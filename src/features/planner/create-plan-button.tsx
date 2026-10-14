"use client";

import { UsersThreeIcon } from "@phosphor-icons/react";
import { useConvexConnectionState, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import type { Locale, RouteDuration } from "@/domain";
import { getOrCreateDeviceKey } from "@/features/planner/device-key";
import { api } from "../../../convex/_generated/api";

type CreateCollaborativePlanButtonProps = {
	duration: RouteDuration;
	locale: Locale;
	label: string;
	busyLabel: string;
	errorLabel: string;
};

export function CreateCollaborativePlanButton({
	duration,
	locale,
	label,
	busyLabel,
	errorLabel,
}: CreateCollaborativePlanButtonProps) {
	const createPlan = useMutation(api.plans.createPlan);
	const { isWebSocketConnected } = useConvexConnectionState();
	const [mounted, setMounted] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Stay disabled until mounted and connected to avoid SSR hydration mismatch
	const ready = mounted && isWebSocketConnected && !busy;

	async function handleCreate() {
		if (!ready) return;
		setBusy(true);
		setError(null);
		try {
			const result = await createPlan({
				duration,
				locale,
				deviceKey: getOrCreateDeviceKey(),
			});
			const prefix = locale === "en" ? "/en" : "";
			window.location.assign(`${prefix}/rencana/${result.planId}#edit=${result.editToken}`);
		} catch {
			setError(errorLabel);
			setBusy(false);
		}
	}

	return (
		<div>
			<button
				className="inline-flex min-h-11 w-full items-center justify-center gap-3 bg-emas px-5 text-sm font-bold text-ink transition-colors hover:bg-[#e2b644] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas disabled:opacity-60 sm:w-auto"
				data-plan-create={ready ? "ready" : "pending"}
				disabled={!ready}
				onClick={() => void handleCreate()}
				type="button"
			>
				<UsersThreeIcon aria-hidden="true" size={18} weight="fill" />
				<span>{busy ? busyLabel : label}</span>
			</button>
			{error ? (
				<p className="mt-2 text-sm text-marwah" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
