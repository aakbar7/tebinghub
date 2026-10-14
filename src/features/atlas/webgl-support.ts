export const MAP_WEBGL_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
	failIfMajorPerformanceCaveat: false,
	powerPreference: "default",
};

function tryContext(type: "webgl2" | "webgl"): boolean {
	const canvas = document.createElement("canvas");
	const gl = canvas.getContext(type, MAP_WEBGL_CONTEXT_ATTRIBUTES) as WebGLRenderingContext | null;
	if (!gl || typeof gl.getExtension !== "function") return false;
	gl.getExtension("WEBGL_lose_context")?.loseContext();
	return true;
}

export function supportsWebGL(): boolean {
	if (typeof document === "undefined") return false;
	try {
		return tryContext("webgl2") || tryContext("webgl");
	} catch {
		return false;
	}
}
