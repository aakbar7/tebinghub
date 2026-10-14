import type { Icon } from "@phosphor-icons/react";
import {
	ArrowUpRightIcon,
	BookOpenIcon,
	ClockCounterClockwiseIcon,
	CoffeeIcon,
	FlagBannerIcon,
	ForkKnifeIcon,
	HouseLineIcon,
	TreeIcon,
	WavesIcon,
} from "@phosphor-icons/react";
import type { PoiCategory } from "@/domain";
import type { AtlasPlace } from "./model";

export const atlasCategoryIcons = {
	landmark: FlagBannerIcon,
	heritage: BookOpenIcon,
	budaya: HouseLineIcon,
	kuliner: ForkKnifeIcon,
	kafe: CoffeeIcon,
	"ruang-publik": TreeIcon,
	rekreasi: WavesIcon,
} as const satisfies Record<PoiCategory, Icon>;

export function atlasPlaceIcon(place: Pick<AtlasPlace, "category" | "scope" | "status">): Icon {
	if (place.status === "historical") return ClockCounterClockwiseIcon;
	if (place.scope === "day-trip") return ArrowUpRightIcon;
	return atlasCategoryIcons[place.category];
}
