import { redis } from "@/server/kv";

const TOKEN_PRICING_KEY = "app:token-pricing";
const DEFAULT_PRICE = 1; // 默认每 1000 tokens 的价格（单位：元）

export interface TokenPricing {
	pricePerThousandTokens: number;
	updatedAt: string;
	updatedBy: string;
}

function normalizePrice(value: number): number {
	return Math.round(value * 100) / 100;
}

async function readTokenPricing(): Promise<TokenPricing | null> {
	const rawValue = await redis.get(TOKEN_PRICING_KEY);
	if (!rawValue) {
		return null;
	}

	try {
		const parsed = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		if (
			parsed &&
			typeof parsed.pricePerThousandTokens === "number" &&
			typeof parsed.updatedAt === "string" &&
			typeof parsed.updatedBy === "string"
		) {
			return {
				pricePerThousandTokens: normalizePrice(parsed.pricePerThousandTokens),
				updatedAt: parsed.updatedAt,
				updatedBy: parsed.updatedBy,
			};
		}
	} catch {
		// ignore parse error
	}

	return null;
}

export async function getTokenPricing(): Promise<TokenPricing> {
	const existing = await readTokenPricing();
	if (existing) {
		return existing;
	}

	const fallbackPrice = normalizePrice(DEFAULT_PRICE);
	return {
		pricePerThousandTokens: fallbackPrice,
		updatedAt: new Date(0).toISOString(),
		updatedBy: "system",
	};
}

export async function updateTokenPricing(params: {
	pricePerThousandTokens: number;
	updatedBy: string;
}): Promise<TokenPricing> {
	const normalizedPrice = normalizePrice(params.pricePerThousandTokens);
	if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
		throw new Error("价格必须大于 0");
	}

	const record: TokenPricing = {
		pricePerThousandTokens: normalizedPrice,
		updatedAt: new Date().toISOString(),
		updatedBy: params.updatedBy,
	};

	await redis.set(TOKEN_PRICING_KEY, JSON.stringify(record));
	return record;
}
