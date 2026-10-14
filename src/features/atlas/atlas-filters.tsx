import { atlasContent, getAtlasLabels } from "@/content/atlas";
import { type Locale, poiScopes, routeDurations } from "@/domain";
import { cn } from "@/lib/cn";
import { atlasCategoriesWithEnoughPlaces } from "./model";
import type { AtlasCategory, AtlasScope, AtlasState } from "./state";

type AtlasFiltersProps = {
	locale: Locale;
	state: AtlasState;
	onCategoryChange: (category: AtlasCategory) => void;
	onScopeChange: (scope: AtlasScope) => void;
	onPlanChange: (plan: AtlasState["plan"]) => void;
};

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
	return (
		<button
			aria-pressed={active}
			className={cn(
				"min-h-8 shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas",
				active
					? "border-river bg-river text-paper"
					: "border-river/25 bg-paper text-ink-muted hover:border-river/60 hover:text-ink",
			)}
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}

function ChipRow({ children, legend }: { children: React.ReactNode; legend: string }) {
	return (
		<fieldset className="min-w-0">
			<legend className="mb-1.5 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-river-bright">
				{legend}
			</legend>
			<div className="flex flex-wrap gap-1.5">{children}</div>
		</fieldset>
	);
}

export function AtlasFilters({ locale, state, onCategoryChange, onScopeChange, onPlanChange }: AtlasFiltersProps) {
	const content = atlasContent[locale];
	const labels = getAtlasLabels(locale);
	const populatedCategories = atlasCategoriesWithEnoughPlaces();
	const categoryChips: AtlasCategory[] =
		state.category !== "all" && !populatedCategories.includes(state.category)
			? ["all", ...populatedCategories, state.category]
			: ["all", ...populatedCategories];

	return (
		<div className="grid gap-3">
			<ChipRow legend={content.categoryLegend}>
				{categoryChips.map((category) => (
					<Chip active={state.category === category} key={category} onClick={() => onCategoryChange(category)}>
						{labels.category[category]}
					</Chip>
				))}
			</ChipRow>

			<ChipRow legend={content.scopeLegend}>
				{(["all", ...poiScopes] as const).map((scope) => (
					<Chip active={state.scope === scope} key={scope} onClick={() => onScopeChange(scope)}>
						{labels.scope[scope]}
					</Chip>
				))}
			</ChipRow>

			<ChipRow legend={content.planLegend}>
				<Chip active={!state.plan && !state.route} onClick={() => onPlanChange(undefined)}>
					{labels.plan.none}
				</Chip>
				{routeDurations.map((plan) => (
					<Chip active={state.plan === plan} key={plan} onClick={() => onPlanChange(plan)}>
						{labels.plan[plan]}
					</Chip>
				))}
			</ChipRow>
		</div>
	);
}
