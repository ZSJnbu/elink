import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const OPENAI_API_KEY_PLACEHOLDER = "sk-placeholder";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		// AI Configuration
		OPENAI_API_KEY: z.string().default(OPENAI_API_KEY_PLACEHOLDER),
		// Tools Configuration
		SERPER_API_KEY: z.string().default("serper-placeholder"),
		// Auth Configuration
		AUTH_SECRET: z
			.string()
			.default("Ky2ov7n23iBtMMvqoVWt8fV/7YhfsKODkwxMqtab5OU="),
		AUTH_TRUST_HOST: z.string().default("true"),
		NEXTAUTH_URL: z.string(),
		// Email Configuration
		PLUNK_API_KEY: z.string().default("plunk-placeholder"),
		ADMIN_EMAIL: z.string().default("admin@example.com"),
		EMAIL_SERVER: z.string().default("smtp.163.com"),
		// 7Pay Configuration
		ZPAY_PID: z.string().default("2025031913250123"),
		ZPAY_KEY: z.string().default("pz8Qrjbsxo226pj8SgNeE0ao39E8ZuPJ"),
		C_ID: z.string().default("10679"),
		// Redis Configuration
		UPSTASH_REDIS_URL: z
			.string()
			.default("https://wanted-duckling-28259.upstash.io"),
		UPSTASH_REDIS_TOKEN: z
			.string()
			.default(
				"AW5jAAIncDJjZjk2NDBhNWViNDg0NDYzODY0NjYxODUyOWVmYjliYnAyMjgyNTk",
			),
		// Admin Configuration
		ADMIN_PORTAL_USERNAME: z.string().default("admin"),
		ADMIN_PORTAL_PASSWORD: z.string().default("admin123"),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		SERPER_API_KEY: process.env.SERPER_API_KEY,
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		PLUNK_API_KEY: process.env.PLUNK_API_KEY,
		ADMIN_EMAIL: process.env.ADMIN_EMAIL,
		EMAIL_SERVER: process.env.EMAIL_SERVER,
		ZPAY_PID: process.env.ZPAY_PID,
		ZPAY_KEY: process.env.ZPAY_KEY,
		C_ID: process.env.C_ID,
		UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
		UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
		ADMIN_PORTAL_USERNAME: process.env.ADMIN_PORTAL_USERNAME,
		ADMIN_PORTAL_PASSWORD: process.env.ADMIN_PORTAL_PASSWORD,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "1" || process.env.CF_PAGES === "1",
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
