export const AI_ERROR_CODES = [
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
] as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export type AiErrorData = {
	code: AiErrorCode;
	message: string;
	retryAfter?: number;
	version?: number;
};

export class AiAppError extends Error {
	readonly code: AiErrorCode;
	readonly retryAfter?: number;
	readonly version?: number;

	constructor(data: AiErrorData) {
		super(data.message);
		this.name = "AiAppError";
		this.code = data.code;
		this.retryAfter = data.retryAfter;
		this.version = data.version;
	}

	toConvexData(): AiErrorData {
		const data: AiErrorData = { code: this.code, message: this.message };
		if (this.retryAfter !== undefined) data.retryAfter = this.retryAfter;
		if (this.version !== undefined) data.version = this.version;
		return data;
	}
}

export function isRetryableProviderFailure(code: AiErrorCode) {
	return (
		code === "PROVIDER_TIMEOUT" ||
		code === "PROVIDER_RATE_LIMITED" ||
		code === "PROVIDER_UNAVAILABLE" ||
		code === "MODEL_RESPONSE_INVALID" ||
		code === "MODEL_LANGUAGE_DRIFT"
	);
}
