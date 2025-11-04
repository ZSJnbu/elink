import { NextResponse } from "next/server";
import { z } from "zod";
import type { KeywordMetadata } from "@/types/keywords";
import type { LinkSearchResult } from "@/types/search";
import { fetchLinksForKeywords, getKeywords } from "@/actions/keywords";
import { findAccessKeyOwner, getAccessTokenForEmail } from "@/server/api-keys/store";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const payloadSchema = z.object({
	accessKey: z
		.string({
			required_error: "必须提供 accessKey",
			invalid_type_error: "accessKey 必须是字符串",
		})
		.min(1, "accessKey 不能为空"),
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
	blacklist: z.union([z.array(z.string()), z.string()]).optional(),
	preferredSites: z.union([z.array(z.string()), z.string()]).optional(),
});

function normalizeList(value?: string | string[]): string[] {
	if (!value) {
		return [];
	}
	const values = Array.isArray(value) ? value : [value];
	const items = values
		.flatMap((entry) => entry.split(","))
		.map((entry) => entry.trim())
		.filter(Boolean);

	return Array.from(new Set(items));
}

export async function POST(request: Request) {
	let jsonPayload: unknown;
	try {
		jsonPayload = await request.json();
	} catch (error) {
		console.error("[external-links-api] 无法解析 JSON 请求体", error);
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_BODY",
					message: "请求体必须是合法的 JSON",
				},
			},
			{ status: 400 },
		);
	}

	if (typeof jsonPayload !== "object" || jsonPayload === null) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_BODY",
					message: "请求体不能为空，且必须是 JSON 对象",
				},
			},
			{ status: 400 },
		);
	}

	const parsed = payloadSchema.safeParse(jsonPayload);

	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		}));
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_BODY",
					message: "请求体参数不合法",
					details: issues,
				},
			},
			{ status: 400 },
		);
	}

	const providedAccessKey = parsed.data.accessKey;
	const providedToken = request.headers.get("x-token")?.trim() ?? undefined;

	if (!providedToken) {
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

	const expectedToken = getAccessTokenForEmail(ownerRecord.email);
	if (providedToken !== expectedToken) {
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
	const normalizedBlacklist = normalizeList(blacklist);
	const normalizedPreferredSites = normalizeList(preferredSites);

	const resolvedProvider =
		provider ?? (apiKey ? "custom" : ("openai" as const));

	if (resolvedProvider === "custom" && !apiKey) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_BODY",
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
				normalizedBlacklist,
				normalizedPreferredSites,
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
