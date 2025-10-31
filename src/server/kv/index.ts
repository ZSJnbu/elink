import { Redis } from "@upstash/redis";
import { env } from "@/env";

let instance: Redis | null = null;

function ensureRedisConfig() {
	if (!env.UPSTASH_REDIS_URL || !env.UPSTASH_REDIS_TOKEN) {
		throw new Error(
			"[redis] 请在环境变量中配置 UPSTASH_REDIS_URL 与 UPSTASH_REDIS_TOKEN。",
		);
	}

	if (!env.UPSTASH_REDIS_URL.startsWith("https://")) {
		throw new Error(
			"[redis] UPSTASH_REDIS_URL 必须是 Upstash 提供的 HTTPS REST 地址。",
		);
	}
}

export function createRedisClient(): Redis {
	ensureRedisConfig();
	return new Redis({
		url: env.UPSTASH_REDIS_URL,
		token: env.UPSTASH_REDIS_TOKEN,
		retry: {
			retries: 3,
			backoff: (retryCount) => Math.exp(retryCount) * 50,
		},
		automaticDeserialization: true,
	});
}

export function getRedisInstance(): Redis {
	if (!instance) {
		instance = createRedisClient();
	}
	return instance;
}

export const redis = getRedisInstance();

export type { Redis } from "@upstash/redis";
