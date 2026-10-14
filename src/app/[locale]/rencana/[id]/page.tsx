import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PlanWorkspace } from "@/features/planner/plan-workspace";
import { routing } from "@/i18n/routing";
import { buildRouteMetadata } from "@/lib/route-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	return buildRouteMetadata(params, "plans", "rencana");
}

export default async function CollaborativePlanPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
	const { locale, id } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	return (
		<main className="min-h-screen bg-paper text-ink">
			<header className="page-masthead page-masthead--compact bg-river px-5 text-paper sm:px-8 lg:px-16">
				<div className="mx-auto max-w-[90rem]">
					<p className="flex items-center gap-3 font-display text-xl italic leading-none text-emas">
						<span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-emas" />
						{locale === "id" ? "Rencana kolaboratif" : "Collaborative plan"}
					</p>
					<p className="mt-4 max-w-[40ch] text-base leading-7 text-paper/80">
						{locale === "id"
							? "Bagikan tautan lihat untuk teman. Sunting hanya dengan tautan yang punya kunci edit."
							: "Share the view link with friends. Editing only works with the edit capability link."}
					</p>
				</div>
			</header>
			<section className="mx-auto w-full max-w-[90rem] px-5 py-12 sm:px-8 lg:px-16 lg:py-16">
				<PlanWorkspace locale={locale} planId={id} />
			</section>
		</main>
	);
}
