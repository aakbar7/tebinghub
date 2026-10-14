import Image from "next/image";
import { useTranslations } from "next-intl";
import { CommemorativeSeals } from "@/components/home/commemorative-strip";
import { Link } from "@/i18n/navigation";

const columns = [
	{
		heading: { id: "Rute", en: "Routes" },
		links: [
			{ href: "/peta", key: "map" },
			{ href: "/rencana", key: "plans" },
		],
	},
	{
		heading: { id: "Bab kota", en: "Chapters" },
		links: [
			{ href: "/sejarah", key: "history" },
			{ href: "/budaya", key: "culture" },
			{ href: "/kuliner", key: "food" },
			{ href: "/wisata", key: "travel" },
			{ href: "/teknologi", key: "technology" },
		],
	},
	{
		heading: { id: "Konteks", en: "Context" },
		links: [{ href: "/tentang", key: "about" }],
	},
] as const;

export function SiteFooter({ locale = "id" }: { locale?: "id" | "en" }) {
	const t = useTranslations("Nav");
	const tFooter = useTranslations("Footer");

	return (
		<footer className="relative overflow-hidden bg-river text-paper">
			<span aria-hidden="true" className="th-ornament-field th-ornament-field--faint" />
			<span aria-hidden="true" className="th-seam-divider absolute inset-x-0 top-0 opacity-70" />

			<div className="relative mx-auto w-full max-w-[90rem] px-5 pb-8 pt-20 sm:px-8 sm:pt-24 lg:px-16">
				<div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
					<div className="lg:col-span-6">
						<Image
							alt="TebingHub"
							className="site-footer__brand-logo"
							height={480}
							src="/images/commemorative/tebinghub-logo-full.webp"
							unoptimized
							width={1400}
						/>
						<p className="mt-4 max-w-[26ch] font-display text-xl italic leading-snug text-paper/85 sm:text-2xl">
							{locale === "id"
								? "Layak disinggahi, bukan cuma dilewati."
								: "Worth stopping for, not just passing through."}
						</p>
						<CommemorativeSeals locale={locale} />
					</div>

					<nav
						aria-label={tFooter("tagline")}
						className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:gap-8"
					>
						{columns.map((column) => (
							<div key={column.heading.id}>
								<p className="font-display text-base italic text-emas">{column.heading[locale]}</p>
								<ul className="mt-4 space-y-1">
									{column.links.map((link) => (
										<li key={link.href}>
											<Link
												className="inline-flex min-h-10 items-center text-sm font-semibold text-paper/78 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
												href={link.href}
											>
												{t(link.key)}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</nav>
				</div>

				<div className="mt-16 grid gap-6 border-t border-paper/15 pt-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
					<div className="space-y-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-paper/60">
						<p>Kota Tebing Tinggi · Sumatera Utara · 3°19′ N 99°09′ E</p>
						<p>
							{locale === "id" ? "Dibangun untuk Nusantara Digital City 2026" : "Built for Nusantara Digital City 2026"}
						</p>
					</div>

					<div className="footer-competition-mark" data-competition-credit>
						<p className="text-[0.68rem] font-semibold leading-relaxed tracking-[0.06em] text-paper/72 [overflow-wrap:anywhere]">
							#kompetisiwebsitedigitalnusantaracity2026
						</p>
						<div className="footer-competition-mark__lockup">
							<span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-river/65">by</span>
							<Image
								alt="Media Cloud Indonesia"
								className="footer-competition-mark__logo"
								height={1080}
								src="/images/brand/mediacloudindonesia.png"
								width={1080}
							/>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
