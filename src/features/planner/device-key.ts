const STORAGE_KEY = "tebinghub.deviceKey";

export function getOrCreateDeviceKey() {
	if (typeof window === "undefined") return "ssr";
	try {
		const existing = window.localStorage.getItem(STORAGE_KEY);
		if (existing) return existing;
		const next = crypto.randomUUID();
		window.localStorage.setItem(STORAGE_KEY, next);
		return next;
	} catch {
		return "anonymous";
	}
}
