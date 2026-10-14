import { ArrowSquareOutIcon, XIcon } from "@phosphor-icons/react";
import { atlasContent, getAtlasLabels } from "@/content/atlas";
import type { Locale } from "@/domain";
import type { AtlasPlace } from "./model";

export function AtlasDetail({ locale, place, onClose }: { locale: Locale; place: AtlasPlace; onClose: () => void }) {
	const content = atlasContent[locale];
	const labels = getAtlasLabels(locale);

	return (
		<div className="flex items-center gap-3 border-t border-emas bg-mist/70 px-4 py-3">
			<div className="min-w-0 flex-1">
				<p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-river-bright">
					{labels.category[place.category]} · {labels.scope[place.scope]}
				</p>
				<h3 className="truncate font-display text-lg font-semibold leading-tight text-river">{place.name}</h3>
			</div>
			<a
				className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-sm font-bold text-river hover:text-marwah focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas"
				href={place.mapsUrl}
				rel="noreferrer"
				target="_blank"
			>
				{content.directions}
				<ArrowSquareOutIcon aria-hidden="true" size={15} weight="bold" />
			</a>
			<button
				aria-label={content.closeDetail}
				className="inline-flex size-10 shrink-0 items-center justify-center text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas"
				onClick={onClose}
				type="button"
			>
				<XIcon aria-hidden="true" size={16} weight="bold" />
			</button>
		</div>
	);
}
