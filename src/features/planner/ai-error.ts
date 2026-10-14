export type AiClientErrorCode =
	| "CONFIGURATION_ERROR"
	| "PROVIDER_TIMEOUT"
	| "PROVIDER_RATE_LIMITED"
	| "PROVIDER_UNAVAILABLE"
	| "MODEL_RESPONSE_INVALID"
	| "MODEL_LANGUAGE_DRIFT"
	| "NO_APPLICABLE_CHANGE"
	| "RATE_LIMITED"
	| "VERSION_CONFLICT"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "VALIDATION_ERROR"
	| "UNKNOWN";

const KNOWN_CODES: ReadonlySet<string> = new Set([
	"CONFIGURATION_ERROR",
	"PROVIDER_TIMEOUT",
	"PROVIDER_RATE_LIMITED",
	"PROVIDER_UNAVAILABLE",
	"MODEL_RESPONSE_INVALID",
	"MODEL_LANGUAGE_DRIFT",
	"NO_APPLICABLE_CHANGE",
	"RATE_LIMITED",
	"VERSION_CONFLICT",
	"FORBIDDEN",
	"NOT_FOUND",
	"VALIDATION_ERROR",
]);

function readDataCode(value: unknown): string | null {
	if (!value || typeof value !== "object") return null;
	const record = value as Record<string, unknown>;
	if (typeof record.code === "string") return record.code;
	if (record.data && typeof record.data === "object" && record.data !== null) {
		const nested = record.data as Record<string, unknown>;
		if (typeof nested.code === "string") return nested.code;
	}
	return null;
}

export function getAiErrorCode(error: unknown): AiClientErrorCode {
	const fromData = readDataCode(error);
	if (fromData && KNOWN_CODES.has(fromData)) return fromData as AiClientErrorCode;

	const text = error instanceof Error ? error.message : String(error);
	try {
		const parsed = JSON.parse(text) as unknown;
		const fromJson = readDataCode(parsed);
		if (fromJson && KNOWN_CODES.has(fromJson)) return fromJson as AiClientErrorCode;
	} catch {
		// fall through to regex fallback
	}

	const match = text.match(
		/\b(CONFIGURATION_ERROR|PROVIDER_TIMEOUT|PROVIDER_RATE_LIMITED|PROVIDER_UNAVAILABLE|MODEL_RESPONSE_INVALID|MODEL_LANGUAGE_DRIFT|NO_APPLICABLE_CHANGE|RATE_LIMITED|VERSION_CONFLICT|FORBIDDEN|NOT_FOUND|VALIDATION_ERROR)\b/,
	);
	if (match?.[1] && KNOWN_CODES.has(match[1])) return match[1] as AiClientErrorCode;

	if (/budget|temporarily limited|rate.?limit/i.test(text)) return "RATE_LIMITED";
	if (/timed out|timeout/i.test(text)) return "PROVIDER_TIMEOUT";
	if (/changed|version/i.test(text)) return "VERSION_CONFLICT";
	return "UNKNOWN";
}
