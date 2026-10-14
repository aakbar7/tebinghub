import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { StopoverPlanner } from "@/components/home/stopover-planner";
import { routing } from "@/i18n/routing";
import { buildRouteMetadata } from "@/lib/route-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	return buildRouteMetadata(params, "plans", "rencana");
}

export default async function PlansPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	return (
		<main className="min-h-screen bg-paper text-ink">
			<header className="page-masthead bg-river px-5 text-paper sm:px-8 lg:px-16">
				<div className="mx-auto max-w-[90rem]">
					<p className="flex items-center gap-3 font-display text-xl italic leading-none text-emas">
						<span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-emas" />
						{locale === "id" ? "Rencana singgah" : "Stopover plans"}
					</p>
					<h1 className="mt-5 max-w-[13ch] font-display text-[clamp(3rem,6vw,6rem)] font-medium leading-[0.92] tracking-[-0.04em]">
						{locale === "id"
							? "Mulai dari waktu yang benar-benar kamu punya."
							: "Start with the time you actually have."}
					</h1>
				</div>
			</header>
			<StopoverPlanner locale={locale} />
		</main>
	);
}
