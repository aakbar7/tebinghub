import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button primitive", () => {
	it("renders an accessible primary action by default", () => {
		render(<Button>Jelajahi kota</Button>);

		const button = screen.getByRole("button", { name: "Jelajahi kota" });
		expect(button).toHaveClass("bg-river");
		expect(button).toHaveClass("rounded-lg");
	});
});
