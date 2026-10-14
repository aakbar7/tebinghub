import { atlasContent, getAtlasLabels } from "@/content/atlas";
import type { Locale } from "@/domain";
import { cn } from "@/lib/cn";
import type { AtlasPlace } from "./model";

type AtlasListProps = {
	locale: Locale;
	places: readonly AtlasPlace[];
	selectedId?: string;
	visibleCount: number;
	onSelect: (id: string) => void;
	onShowMore: () => void;
	showIndex?: boolean;
	emptyLabel?: string;
};

export function AtlasList({
	locale,
	places,
	selectedId,
	visibleCount,
	onSelect,
	onShowMore,
	showIndex = false,
	emptyLabel,
}: AtlasListProps) {
	const content = atlasContent[locale];
	const labels = getAtlasLabels(locale);
	const visible = places.slice(0, visibleCount);

	return (
		<section
			aria-label={locale === "id" ? "Daftar tempat atlas" : "Atlas place list"}
			data-testid="atlas-fallback-list"
		>
			{emptyLabel ? null : (
				<p aria-live="polite" className="mb-2 text-xs font-bold text-river">
					{places.length} {content.results}
				</p>
			)}

			{places.length ? (
				<div className="divide-y divide-river/12 border-y border-river/15">
					{visible.map((place, index) => (
						<button
							aria-pressed={selectedId === place.id}
							className={cn(
								"grid w-full grid-cols-[0.85rem_minmax(0,1fr)] items-baseline gap-3 px-1.5 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas",
								selectedId === place.id ? "bg-mist/70" : "hover:bg-mist/45",
							)}
							key={place.id}
							onClick={() => onSelect(place.id)}
							type="button"
						>
							<span
								aria-hidden="true"
								className={cn(
									"relative top-[-0.05rem] block size-2 rotate-45 self-center",
									selectedId === place.id ? "bg-emas" : "border border-river/45 bg-transparent",
								)}
							/>
							<span>
								<span className="block text-sm font-bold leading-5 text-ink">
									{showIndex ? <span className="tabular-nums font-bold">{index + 1} </span> : null}
									{place.name}
								</span>
								<span className="mt-0.5 block text-xs leading-5 text-ink-muted">
									{labels.category[place.category]} · {labels.scope[place.scope]}
								</span>
							</span>
						</button>
					))}
				</div>
			) : (
				<p className="border-y border-river/15 py-10 text-sm leading-6 text-ink-muted" role="status">
					{emptyLabel ?? content.noResults}
				</p>
			)}

			{places.length > visibleCount ? (
				<button
					className="mt-4 min-h-11 border-b border-river text-sm font-bold text-river focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
					onClick={onShowMore}
					type="button"
				>
					{content.showMore} · {places.length - visibleCount}
				</button>
			) : null}
		</section>
	);
}
