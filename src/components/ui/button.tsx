import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const variants = {
	primary: "bg-river text-white hover:bg-river-bright focus-visible:outline-river",
	secondary: "bg-emas text-ink hover:bg-[#e4b83e] focus-visible:outline-emas",
	outline: "border border-river/25 text-river hover:border-river/60 hover:bg-mist/60 focus-visible:outline-river",
	ghost: "text-river hover:bg-mist/70 focus-visible:outline-river",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonStyles(variant: ButtonVariant = "primary") {
	return cn(
		"inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors",
		"focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
		variants[variant],
	);
}

export function Button({
	className,
	variant = "primary",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
	return <button className={cn(buttonStyles(variant), className)} {...props} />;
}
