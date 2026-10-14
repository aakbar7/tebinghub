import { defaultVisitMinutesFor } from "./aiCatalog";
import { clampPlanTitle } from "./poi";

export const MAX_AI_OPERATIONS = 6;
export const MAX_AI_MESSAGE_LENGTH = 400;

export const RETAIN_AT_LEAST_ONE_STOP_REASON = "Plan must include at least one stop.";

export type AiRetryHintCode =
	| "RETAIN_AT_LEAST_ONE_STOP"
	| "VALID_OPERATION_SEQUENCE"
	| "VALID_PLAN_REFERENCES"
	| "VALID_JSON_ONLY";

// Allowlisted corrective feedback; never includes model-controlled values.
export const AI_RETRY_HINT_MESSAGES: Record<AiRetryHintCode, string> = {
	RETAIN_AT_LEAST_ONE_STOP:
		"The previous candidate operation set was invalid because a plan must retain at least one stop. Return corrected JSON that preserves at least one stop. Do not remove stops unless USER_REQUEST explicitly asks for removal.",
	VALID_OPERATION_SEQUENCE:
		"The previous candidate operation set was invalid when applied in order. Return corrected JSON with a valid sequential operation set that matches USER_REQUEST.",
	VALID_PLAN_REFERENCES:
		"The previous candidate operation set referenced invalid plan stops or POIs. Return corrected JSON using only stop IDs and catalog POI IDs from PLAN_CONTEXT_JSON.",
	VALID_JSON_ONLY:
		"The previous candidate response was not valid machine JSON for the schema. Return only a bare JSON object with an operations array and a title, and no prose, fences, or thinking tags.",
};

// Reasons may embed model-controlled values, so they are matched by prefix only.
export function retryHintForModelFailure(reason: string): AiRetryHintCode {
	if (reason === RETAIN_AT_LEAST_ONE_STOP_REASON) return "RETAIN_AT_LEAST_ONE_STOP";
	if (
		reason === "stopId was not found." ||
		reason === "afterStopId was not found." ||
		reason.startsWith("POI is not allowed")
	) {
		return "VALID_PLAN_REFERENCES";
	}
	if (
		reason === "Model returned invalid JSON." ||
		reason === "Model returned an empty completion." ||
		reason === "Model response contained Markdown fences." ||
		reason === "Model response contained thinking markup." ||
		reason === "Model response must be a bare JSON object." ||
		reason === "Model response must be an object with an operations array and optional title." ||
		reason === "Model response title must be a string." ||
		reason === "Model response must include an operations array." ||
		reason === "Model response contained disallowed Han characters." ||
		reason.startsWith("Model returned more than")
	) {
		return "VALID_JSON_ONLY";
	}
	return "VALID_OPERATION_SEQUENCE";
}

export type AiPlanOperation =
	| { type: "addStop"; poiId: string; afterStopId?: string }
	| { type: "removeStop"; stopId: string }
	| { type: "reorder"; stopId: string; afterStopId?: string }
	| { type: "setDuration"; stopId: string; visitDurationMinutes: number };

export type AiPlanRevision = {
	operations: AiPlanOperation[];
	title?: string;
};

export type AiOpsParseResult =
	| ({ ok: true } & AiPlanRevision)
	| { ok: false; reason: string; code?: "MODEL_RESPONSE_INVALID" | "MODEL_LANGUAGE_DRIFT" };

type PlanStopLike = {
	id: string;
	poiId: string;
	visitDurationMinutes: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractOperationsPayload(raw: unknown): unknown {
	if (Array.isArray(raw)) return raw;
	if (isRecord(raw) && Array.isArray(raw.operations)) return raw.operations;
	return null;
}

function hasHanCharacters(value: string) {
	try {
		return /\p{Script=Han}/u.test(value);
	} catch {
		return /[\u3400-\u9FFF\uF900-\uFAFF]/u.test(value);
	}
}

// Reject untrusted model text outright instead of trying to sanitize it.
export function inspectModelCompletion(raw: string): AiOpsParseResult | null {
	if (typeof raw !== "string" || raw.trim().length === 0) {
		return { ok: false, reason: "Model returned an empty completion.", code: "MODEL_RESPONSE_INVALID" };
	}
	if (hasHanCharacters(raw)) {
		return {
			ok: false,
			reason: "Model response contained disallowed Han characters.",
			code: "MODEL_LANGUAGE_DRIFT",
		};
	}
	if (/<think>/i.test(raw) || /<\/think>/i.test(raw)) {
		return {
			ok: false,
			reason: "Model response contained thinking markup.",
			code: "MODEL_RESPONSE_INVALID",
		};
	}
	if (/```/.test(raw)) {
		return {
			ok: false,
			reason: "Model response contained Markdown fences.",
			code: "MODEL_RESPONSE_INVALID",
		};
	}
	const trimmed = raw.trim();
	if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
		return {
			ok: false,
			reason: "Model response must be a bare JSON object.",
			code: "MODEL_RESPONSE_INVALID",
		};
	}
	return null;
}

function parseOneOperation(value: unknown, allowedPoiIds: ReadonlySet<string>): AiPlanOperation {
	if (!isRecord(value) || typeof value.type !== "string") {
		throw new Error("Each operation must be an object with a type.");
	}

	switch (value.type) {
		case "addStop": {
			if (typeof value.poiId !== "string" || !allowedPoiIds.has(value.poiId)) {
				throw new Error(`POI is not allowed in collaborative plans: ${String(value.poiId)}`);
			}
			const op: AiPlanOperation = { type: "addStop", poiId: value.poiId };
			if (value.afterStopId !== undefined && value.afterStopId !== null) {
				if (typeof value.afterStopId !== "string") throw new Error("afterStopId must be a string.");
				if (value.afterStopId.length > 0) op.afterStopId = value.afterStopId;
			}
			return op;
		}
		case "removeStop": {
			if (typeof value.stopId !== "string" || value.stopId.length === 0) {
				throw new Error("removeStop requires stopId.");
			}
			return { type: "removeStop", stopId: value.stopId };
		}
		case "reorder": {
			if (typeof value.stopId !== "string" || value.stopId.length === 0) {
				throw new Error("reorder requires stopId.");
			}
			const op: AiPlanOperation = { type: "reorder", stopId: value.stopId };
			if (value.afterStopId !== undefined && value.afterStopId !== null) {
				if (typeof value.afterStopId !== "string") throw new Error("afterStopId must be a string.");
				if (value.afterStopId.length > 0) op.afterStopId = value.afterStopId;
			}
			return op;
		}
		case "setDuration": {
			if (typeof value.stopId !== "string") throw new Error("setDuration requires stopId.");
			if (typeof value.visitDurationMinutes !== "number" || !Number.isFinite(value.visitDurationMinutes)) {
				throw new Error("setDuration requires visitDurationMinutes.");
			}
			if (!Number.isInteger(value.visitDurationMinutes)) {
				throw new Error("visitDurationMinutes must be an integer.");
			}
			return {
				type: "setDuration",
				stopId: value.stopId,
				visitDurationMinutes: value.visitDurationMinutes,
			};
		}
		default:
			throw new Error(`Unsupported operation type: ${value.type}`);
	}
}

export function clampAiMessage(message: string) {
	return message.trim().slice(0, MAX_AI_MESSAGE_LENGTH);
}

export function parseAiOperationsJson(raw: string, allowedPoiIds: ReadonlySet<string>): AiOpsParseResult {
	const inspection = inspectModelCompletion(raw);
	if (inspection) return inspection;

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw.trim());
	} catch {
		return { ok: false, reason: "Model returned invalid JSON.", code: "MODEL_RESPONSE_INVALID" };
	}

	if (!isRecord(parsed) || !Object.hasOwn(parsed, "operations")) {
		return {
			ok: false,
			reason: "Model response must be an object with an operations array and optional title.",
			code: "MODEL_RESPONSE_INVALID",
		};
	}
	for (const key of Object.keys(parsed)) {
		if (key !== "operations" && key !== "title") {
			return {
				ok: false,
				reason: "Model response must be an object with an operations array and optional title.",
				code: "MODEL_RESPONSE_INVALID",
			};
		}
	}

	let title: string | undefined;
	if (Object.hasOwn(parsed, "title")) {
		if (typeof parsed.title !== "string") {
			return {
				ok: false,
				reason: "Model response title must be a string.",
				code: "MODEL_RESPONSE_INVALID",
			};
		}
		const clamped = clampPlanTitle(parsed.title);
		if (clamped) title = clamped;
	}

	const payload = extractOperationsPayload(parsed);
	if (!Array.isArray(payload)) {
		return {
			ok: false,
			reason: "Model response must include an operations array.",
			code: "MODEL_RESPONSE_INVALID",
		};
	}
	if (payload.length > MAX_AI_OPERATIONS) {
		return {
			ok: false,
			reason: `Model returned more than ${MAX_AI_OPERATIONS} operations.`,
			code: "MODEL_RESPONSE_INVALID",
		};
	}

	try {
		const operations = payload.map((item) => parseOneOperation(item, allowedPoiIds));
		return title ? { ok: true, operations, title } : { ok: true, operations };
	} catch (error) {
		return {
			ok: false,
			reason: error instanceof Error ? error.message : "Invalid operations.",
			code: "MODEL_RESPONSE_INVALID",
		};
	}
}

export function validateAiOperationsAgainstPlan(
	operations: AiPlanOperation[],
	stops: PlanStopLike[],
	allowedPoiIds: ReadonlySet<string>,
	options?: { maxStops?: number },
): AiOpsParseResult {
	const maxStops = options?.maxStops ?? 12;
	let next = [...stops];

	for (const operation of operations) {
		switch (operation.type) {
			case "addStop": {
				if (!allowedPoiIds.has(operation.poiId)) {
					return {
						ok: false,
						reason: `POI is not allowed in collaborative plans: ${operation.poiId}`,
						code: "MODEL_RESPONSE_INVALID",
					};
				}
				if (next.some((stop) => stop.poiId === operation.poiId)) {
					return { ok: false, reason: "Plan stops must use unique POI IDs.", code: "MODEL_RESPONSE_INVALID" };
				}
				if (next.length >= maxStops) {
					return { ok: false, reason: `Plan cannot exceed ${maxStops} stops.`, code: "MODEL_RESPONSE_INVALID" };
				}
				if (operation.afterStopId && !next.some((stop) => stop.id === operation.afterStopId)) {
					return { ok: false, reason: "afterStopId was not found.", code: "MODEL_RESPONSE_INVALID" };
				}
				const inserted = {
					id: `pending_${operation.poiId}`,
					poiId: operation.poiId,
					visitDurationMinutes: defaultVisitMinutesFor(operation.poiId),
				};
				if (operation.afterStopId) {
					const afterIndex = next.findIndex((stop) => stop.id === operation.afterStopId);
					next = [...next.slice(0, afterIndex + 1), inserted, ...next.slice(afterIndex + 1)];
				} else {
					next = [...next, inserted];
				}
				break;
			}
			case "removeStop": {
				if (!next.some((stop) => stop.id === operation.stopId)) {
					return { ok: false, reason: "stopId was not found.", code: "MODEL_RESPONSE_INVALID" };
				}
				if (next.length <= 1) {
					return { ok: false, reason: RETAIN_AT_LEAST_ONE_STOP_REASON, code: "MODEL_RESPONSE_INVALID" };
				}
				next = next.filter((stop) => stop.id !== operation.stopId);
				break;
			}
			case "reorder": {
				const index = next.findIndex((stop) => stop.id === operation.stopId);
				if (index < 0) return { ok: false, reason: "stopId was not found.", code: "MODEL_RESPONSE_INVALID" };
				const [moved] = next.splice(index, 1);
				if (!moved) return { ok: false, reason: "stopId was not found.", code: "MODEL_RESPONSE_INVALID" };
				if (operation.afterStopId === undefined) {
					next = [moved, ...next];
				} else {
					const afterIndex = next.findIndex((stop) => stop.id === operation.afterStopId);
					if (afterIndex < 0)
						return { ok: false, reason: "afterStopId was not found.", code: "MODEL_RESPONSE_INVALID" };
					next = [...next.slice(0, afterIndex + 1), moved, ...next.slice(afterIndex + 1)];
				}
				break;
			}
			case "setDuration": {
				if (!next.some((stop) => stop.id === operation.stopId)) {
					return { ok: false, reason: "stopId was not found.", code: "MODEL_RESPONSE_INVALID" };
				}
				if (
					!Number.isFinite(operation.visitDurationMinutes) ||
					!Number.isInteger(operation.visitDurationMinutes) ||
					operation.visitDurationMinutes < 5 ||
					operation.visitDurationMinutes > 240
				) {
					return {
						ok: false,
						reason: "Visit duration must be between 5 and 240 minutes.",
						code: "MODEL_RESPONSE_INVALID",
					};
				}
				next = next.map((stop) =>
					stop.id === operation.stopId ? { ...stop, visitDurationMinutes: operation.visitDurationMinutes } : stop,
				);
				break;
			}
			default: {
				const _exhaustive: never = operation;
				return {
					ok: false,
					reason: `Unsupported operation: ${JSON.stringify(_exhaustive)}`,
					code: "MODEL_RESPONSE_INVALID",
				};
			}
		}
	}

	return { ok: true, operations };
}

export function parseAndValidateAiOperations(
	raw: string,
	stops: PlanStopLike[],
	allowedPoiIds: ReadonlySet<string>,
): AiOpsParseResult {
	const parsed = parseAiOperationsJson(raw, allowedPoiIds);
	if (!parsed.ok) return parsed;
	if (parsed.operations.length === 0) return parsed;
	const validated = validateAiOperationsAgainstPlan(parsed.operations, stops, allowedPoiIds);
	if (!validated.ok) return validated;
	return parsed.title
		? { ok: true, operations: validated.operations, title: parsed.title }
		: { ok: true, operations: validated.operations };
}
