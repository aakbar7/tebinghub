import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StopoverConcierge } from "@/components/home/stopover-concierge";

const createPlan = vi.fn();
const reviseWithAi = vi.fn();
const assign = vi.fn();

vi.mock("convex/react", () => ({
	useMutation: () => createPlan,
	useAction: () => reviseWithAi,
}));

vi.mock("@/features/planner/device-key", () => ({
	getOrCreateDeviceKey: () => "device-test",
}));

describe("StopoverConcierge AI flow", () => {
	beforeEach(() => {
		createPlan.mockReset();
		reviseWithAi.mockReset();
		assign.mockReset();
		Object.defineProperty(window, "location", {
			configurable: true,
			value: { assign },
		});
	});

	it("presents a visible field label, idle guidance, and an unavailable empty submit", () => {
		render(<StopoverConcierge duration="two-hours" locale="id" />);

		expect(screen.getByLabelText("Ceritakan rute yang kamu inginkan")).toBeInTheDocument();
		expect(screen.getByText("Kirim dengan Ctrl/Command + Enter.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Susun dengan AI" })).toBeDisabled();
		expect(screen.getByRole("form", { name: "Bantuan AI" })).toHaveAttribute("data-state", "idle");
	});

	it("shows validation after leaving an empty field and clears it while typing", () => {
		render(<StopoverConcierge duration="two-hours" locale="id" />);
		const textbox = screen.getByRole("textbox", { name: "Ceritakan rute yang kamu inginkan" });

		fireEvent.focus(textbox);
		fireEvent.blur(textbox);

		expect(screen.getByRole("alert")).toHaveTextContent("Tulis kebutuhan rute terlebih dahulu.");
		expect(textbox).toHaveAttribute("aria-invalid", "true");

		fireEvent.change(textbox, { target: { value: "ruang hijau" } });
		expect(screen.queryByText("Tulis kebutuhan rute terlebih dahulu.")).toBeNull();
		expect(textbox).toHaveAttribute("aria-invalid", "false");
	});

	it("submits with Ctrl+Enter while plain Enter remains available for a new line", async () => {
		createPlan.mockResolvedValue({
			planId: "plans:keyboard",
			editToken: "token-keyboard",
			version: 1,
		});
		reviseWithAi.mockResolvedValue({
			plan: { version: 2 },
			operations: [{ type: "addStop", poiId: "taman-kota" }],
		});

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		const textbox = screen.getByRole("textbox", { name: "Ceritakan rute yang kamu inginkan" });
		fireEvent.change(textbox, { target: { value: "ruang hijau" } });
		fireEvent.keyDown(textbox, { key: "Enter" });
		expect(createPlan).not.toHaveBeenCalled();

		fireEvent.keyDown(textbox, { key: "Enter", ctrlKey: true });

		await waitFor(() => expect(reviseWithAi).toHaveBeenCalledTimes(1));
	});

	it("exposes submitting and success states without allowing duplicate submission", async () => {
		let resolveRevision: ((value: { plan: { version: number }; operations: unknown[] }) => void) | undefined;
		createPlan.mockResolvedValue({
			planId: "plans:states",
			editToken: "token-states",
			version: 1,
		});
		reviseWithAi.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveRevision = resolve;
				}),
		);

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "ruang hijau" } });
		fireEvent.click(screen.getByRole("button", { name: "Susun dengan AI" }));

		const form = screen.getByRole("form", { name: "Bantuan AI" });
		await waitFor(() => expect(form).toHaveAttribute("data-state", "submitting"));
		expect(form).toHaveAttribute("aria-busy", "true");
		expect(screen.getByRole("button", { name: "AI sedang menyusun…" })).toBeDisabled();

		fireEvent.submit(form);
		expect(createPlan).toHaveBeenCalledTimes(1);
		expect(reviseWithAi).toHaveBeenCalledTimes(1);

		resolveRevision?.({
			plan: { version: 2 },
			operations: [{ type: "addStop", poiId: "taman-kota" }],
		});

		expect(await screen.findByRole("status")).toHaveTextContent("Rute siap. Membuka editor…");
		expect(form).toHaveAttribute("data-state", "success");
	});

	it.each([
		["RATE_LIMITED", "Jatah bantuan AI sementara sudah habis."],
		["PROVIDER_TIMEOUT", "Layanan AI terlalu lama merespons."],
		["CONFIGURATION_ERROR", "Bantuan AI belum tersedia karena belum dikonfigurasi."],
	])("shows a distinct %s state", async (code, expectedMessage) => {
		createPlan.mockResolvedValue({
			planId: `plans:${code}`,
			editToken: `token-${code}`,
			version: 1,
		});
		reviseWithAi.mockRejectedValue({ data: { code, message: "provider detail" } });

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "ruang hijau" } });
		fireEvent.click(screen.getByRole("button", { name: "Susun dengan AI" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(expectedMessage);
		expect(screen.getByRole("form", { name: "Bantuan AI" })).toHaveAttribute("data-state", "error");
	});

	it("redirects only after AI applies at least one operation", async () => {
		createPlan.mockResolvedValue({
			planId: "plans:1",
			editToken: "token-1",
			version: 1,
		});
		reviseWithAi.mockResolvedValue({
			plan: { version: 2 },
			operations: [{ type: "addStop", poiId: "taman-kota" }],
		});

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "jadi lemang dan teduh" } });
		fireEvent.click(screen.getByRole("button", { name: "Susun dengan AI" }));

		await waitFor(() => {
			expect(reviseWithAi).toHaveBeenCalledWith(
				expect.objectContaining({
					planId: "plans:1",
					editToken: "token-1",
					expectedVersion: 1,
				}),
			);
			expect(assign).toHaveBeenCalledWith("/rencana/plans:1#edit=token-1");
		});
	});

	it("keeps the draft on AI failure, shows alert, and retries the same plan", async () => {
		createPlan.mockResolvedValue({
			planId: "plans:2",
			editToken: "token-2",
			version: 1,
		});
		reviseWithAi
			.mockRejectedValueOnce({ data: { code: "PROVIDER_UNAVAILABLE", message: "down" } })
			.mockResolvedValueOnce({
				plan: { version: 2 },
				operations: [{ type: "addStop", poiId: "taman-kota" }],
			});

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "lemang teduh" } });
		fireEvent.click(screen.getByRole("button", { name: "Susun dengan AI" }));

		expect(await screen.findByRole("alert")).toBeInTheDocument();
		expect(assign).not.toHaveBeenCalled();
		expect(createPlan).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
		await waitFor(() => {
			expect(createPlan).toHaveBeenCalledTimes(1);
			expect(reviseWithAi).toHaveBeenCalledTimes(2);
			expect(reviseWithAi.mock.calls[1]?.[0]).toMatchObject({
				planId: "plans:2",
				editToken: "token-2",
				expectedVersion: 1,
			});
		});
	});

	it("offers manual continue only when a draft exists", async () => {
		createPlan.mockRejectedValue(new Error("create failed"));

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "lemang" } });
		fireEvent.click(screen.getByRole("button", { name: "Susun dengan AI" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(/belum bisa dibuat/i);
		expect(screen.queryByRole("button", { name: "Lanjut sunting manual" })).toBeNull();
		expect(assign).not.toHaveBeenCalled();
	});

	it("redirects with the same draft when continuing manually after AI failure", async () => {
		createPlan.mockResolvedValue({
			planId: "plans:manual",
			editToken: "token-manual",
			version: 1,
		});
		reviseWithAi.mockRejectedValue({ data: { code: "PROVIDER_UNAVAILABLE", message: "down" } });

		render(<StopoverConcierge duration="two-hours" locale="id" />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "lemang teduh" } });
		fireEvent.click(screen.getByRole("button", { name: "Susun dengan AI" }));

		expect(await screen.findByRole("alert")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Lanjut sunting manual" }));

		expect(createPlan).toHaveBeenCalledTimes(1);
		expect(assign).toHaveBeenCalledTimes(1);
		expect(assign).toHaveBeenCalledWith("/rencana/plans:manual#edit=token-manual");
	});
});
