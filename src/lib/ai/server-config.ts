import { createOpenAI, openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { env, OPENAI_API_KEY_PLACEHOLDER } from "@/env";

const FALLBACK_MODEL = "gpt-4o-mini";

export function getDefaultModelName(preferredModel?: string): string {
	return preferredModel?.trim() || env.OPENAI_MODEL || FALLBACK_MODEL;
}

export function hasServerAIKey(): boolean {
	return (
		!!env.OPENAI_API_KEY && env.OPENAI_API_KEY !== OPENAI_API_KEY_PLACEHOLDER
	);
}

export function getServerAIModel(
	preferredModel?: string,
): LanguageModel | null {
	if (!hasServerAIKey()) {
		return null;
	}

	const modelName = getDefaultModelName(preferredModel);
	const baseURL = env.OPENAI_BASE_URL?.trim();

	if (baseURL) {
		const serverOpenAI = createOpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL,
		});
		return serverOpenAI(modelName);
	}

	return openai(modelName);
}
