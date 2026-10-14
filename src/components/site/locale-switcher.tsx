"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/domain";
import { Link, usePathname } from "@/i18n/navigation";

function LocaleLinks({ locale, href, transparent }: { locale: Locale; href: string; transparent: boolean }) {
	return (
		<fieldset className="site-locale" data-overlay={transparent}>
			<legend className="sr-only">{locale === "id" ? "Bahasa" : "Language"}</legend>
			<div className="site-locale__options">
				{(["id", "en"] as const).map((item) => {
					const label = item === "id" ? "Bahasa Indonesia" : "English";
					return (
						<Link
							aria-current={locale === item ? "page" : undefined}
							aria-label={label}
							className="site-locale__option focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emas"
							data-active={locale === item}
							data-locale={item}
							href={href}
							key={item}
							locale={item}
							title={label}
						>
							<span aria-hidden="true" className="site-locale__flag" />
						</Link>
					);
				})}
			</div>
		</fieldset>
	);
}

function LocaleSwitcherInner({ locale, transparent }: { locale: Locale; transparent: boolean }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const query = searchParams.toString();
	const href = query ? `${pathname}?${query}` : pathname;
	return <LocaleLinks href={href} locale={locale} transparent={transparent} />;
}

function LocaleSwitcherFallback({ locale, transparent }: { locale: Locale; transparent: boolean }) {
	const pathname = usePathname();
	return <LocaleLinks href={pathname} locale={locale} transparent={transparent} />;
}

export function LocaleSwitcher({ locale, transparent = false }: { locale: Locale; transparent?: boolean }) {
	return (
		<Suspense fallback={<LocaleSwitcherFallback locale={locale} transparent={transparent} />}>
			<LocaleSwitcherInner locale={locale} transparent={transparent} />
		</Suspense>
	);
}
