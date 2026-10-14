/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as lib_aiCatalog from "../lib/aiCatalog.js";
import type * as lib_aiErrors from "../lib/aiErrors.js";
import type * as lib_aiOps from "../lib/aiOps.js";
import type * as lib_applyOps from "../lib/applyOps.js";
import type * as lib_openrouter from "../lib/openrouter.js";
import type * as lib_poi from "../lib/poi.js";
import type * as lib_validators from "../lib/validators.js";
import type * as plans from "../plans.js";
import type * as rateLimits from "../rateLimits.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  "lib/aiCatalog": typeof lib_aiCatalog;
  "lib/aiErrors": typeof lib_aiErrors;
  "lib/aiOps": typeof lib_aiOps;
  "lib/applyOps": typeof lib_applyOps;
  "lib/openrouter": typeof lib_openrouter;
  "lib/poi": typeof lib_poi;
  "lib/validators": typeof lib_validators;
  plans: typeof plans;
  rateLimits: typeof rateLimits;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
