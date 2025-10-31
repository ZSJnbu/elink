import { NextResponse } from "next/server";
import { z } from "zod";
import type { KeywordMetadata } from "@/types/keywords";
import type { LinkSearchResult } from "@/types/search";
import { fetchLinksForKeywords, getKeywords } from "@/actions/keywords";
import { findAccessKeyOwner } from "@/server/api-keys/store";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const querySchema = z.object({
	text: z
		.string({
			required_error: "文本参数 text 为必填",
			invalid_type_error: "文本参数 text 必须是字符串",
		})
		.min(1, "文本参数 text 不能为空"),
	fingerprint: z.string().optional(),
	apiKey: z.string().optional(),
	baseUrl: z.string().optional(),
	model: z.string().optional(),
	provider: z.enum(["openai", "custom"]).optional(),
	blacklist: z.array(z.string()).default([]),
	preferredSites: z.array(z.string()).default([]),
});

function parseList(params: URLSearchParams, key: string): string[] {
	const values = [
		...params.getAll(key),
		...params.getAll(`${key}[]`),
	];

	if (values.length === 0) {
		const singleValue = params.get(key);
		if (singleValue) {
			values.push(singleValue);
		}
	}

	const items = values
		.flatMap((value) => value.split(","))
		.map((value) => value.trim())
		.filter(Boolean);

	return Array.from(new Set(items));
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const searchParams = url.searchParams;

	const providedAccessKey = searchParams.get("accessKey") ?? undefined;

	if (!providedAccessKey) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "UNAUTHORIZED",
					message: "未被授权使用 Elink",
				},
			},
			{ status: 401 },
		);
	}

const ownerRecord = await findAccessKeyOwner(providedAccessKey);
if (!ownerRecord) {
	return NextResponse.json(
		{
			success: false,
			error: {
				code: "UNAUTHORIZED",
					message: "未被授权使用 Elink",
				},
			},
			{ status: 401 },
		);
	}

	const rawParams = {
		text: searchParams.get("text"),
		fingerprint: searchParams.get("fingerprint") ?? undefined,
		apiKey: searchParams.get("apiKey") ?? undefined,
		baseUrl: searchParams.get("baseUrl") ?? undefined,
		model: searchParams.get("model") ?? undefined,
		provider: (searchParams.get("provider") ?? undefined) as
			| "openai"
			| "custom"
			| undefined,
		blacklist: parseList(searchParams, "blacklist"),
		preferredSites: parseList(searchParams, "preferredSites"),
	};

	const parsed = querySchema.safeParse(rawParams);

	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		}));
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_QUERY",
					message: "请求参数不合法",
					details: issues,
				},
			},
			{ status: 400 },
		);
	}

	const {
		text,
		fingerprint,
		apiKey,
		baseUrl,
		model,
		blacklist,
		preferredSites,
		provider,
	} = parsed.data;

	const resolvedProvider =
		provider ?? (apiKey ? "custom" : ("openai" as const));

	if (resolvedProvider === "custom" && !apiKey) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_QUERY",
					message:
						"使用自定义模型时必须提供 apiKey 参数（以及可选的 baseUrl）",
				},
			},
			{ status: 400 },
		);
	}

	const resolvedBaseUrl =
		resolvedProvider === "openai"
			? baseUrl ?? DEFAULT_OPENAI_BASE_URL
			: baseUrl;

	try {
	const keywordResult = await getKeywords(
		text,
		fingerprint,
		0,
		apiKey || undefined,
		resolvedBaseUrl || undefined,
		model || undefined,
		ownerRecord.email,
	);

		if (keywordResult.error) {
			const status =
				keywordResult.error.code === "RATE_LIMITED" ? 429 : 400;
			return NextResponse.json(
				{
					success: false,
					error: {
						code: keywordResult.error.code,
						message: keywordResult.error.message,
					},
				},
				{ status },
			);
		}

		if (!keywordResult.data) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "AI_ERROR",
						message: "关键词分析失败：未返回任何数据",
					},
				},
				{ status: 500 },
			);
		}

		const keywords = keywordResult.data.keywords;

		let linkMap: Record<string, LinkSearchResult> = {};
		let linkFetchError: Error | null = null;

		try {
			linkMap = await fetchLinksForKeywords(
				keywords.map((keyword) => ({
					keyword: keyword.keyword,
					query: keyword.query,
				})),
				blacklist,
				preferredSites,
			);
		} catch (error) {
			linkFetchError = error instanceof Error ? error : new Error(String(error));
			console.error("[external-links-api] 获取外链失败", linkFetchError);
		}

		const enrichedKeywords: KeywordMetadata[] = keywords.map((keyword) => {
			const linkInfo = linkMap[keyword.keyword as keyof typeof linkMap];
			return {
				...keyword,
				link: linkInfo?.link ?? null,
				title: linkInfo?.title ?? null,
				alternatives: linkInfo?.alternatives ?? {
					preferred: [],
					regular: [],
				},
			};
		});

		return NextResponse.json({
			success: true,
			data: {
				keywords: enrichedKeywords,
				usage: keywordResult.data.usage,
				linkFetchError: linkFetchError
					? {
							message: linkFetchError.message,
							name: linkFetchError.name,
					  }
					: null,
			},
		});
	} catch (error) {
		console.error("[external-links-api] 调用失败", error);
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "外链优化 API 调用失败，请稍后重试",
				},
			},
			{ status: 500 },
		);
	}
}
