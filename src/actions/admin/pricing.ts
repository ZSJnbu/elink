'use server';

import { auth } from "@/auth";
import { updateTokenPricing } from "@/server/billing/pricing";

export interface TokenPricingActionState {
	status: "idle" | "success" | "error";
	code?: "unauthorized" | "invalid" | "unknown";
	price?: number;
}

export async function updateTokenPricingAction(
	_prevState: TokenPricingActionState,
	formData: FormData,
): Promise<TokenPricingActionState> {
	const session = await auth();
	if (!session?.user?.isAdmin) {
		return {
			status: "error",
			code: "unauthorized",
		};
	}

	const rawValue = formData.get("price");
	const price = Number.parseFloat(
		typeof rawValue === "string" ? rawValue : String(rawValue ?? ""),
	);

	if (!Number.isFinite(price) || price <= 0) {
		return {
			status: "error",
			code: "invalid",
		};
	}

	try {
		const record = await updateTokenPricing({
			pricePerThousandTokens: price,
			updatedBy: session.user.email ?? session.user.id ?? "admin",
		});

		return {
			status: "success",
			price: record.pricePerThousandTokens,
		};
	} catch (error) {
		console.error("更新 token 定价失败", error);
		return {
			status: "error",
			code: "unknown",
		};
	}
}
