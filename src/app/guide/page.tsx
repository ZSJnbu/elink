import { CopyCommandButton } from "@/components/guide/copy-command-button";
import SiteHeader from "@/components/layout/site-header";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const headerRequirements = [
	{
		name: "Content-Type",
		type: "string",
		required: true,
		description: "固定为 `application/json`，确保请求体以 JSON 发送。",
	},
	{
		name: "x-token",
		type: "string",
		required: true,
		description: "请求 Token，可在密钥管理或“密钥”页面直接复制。",
	},
];

const bodyFields = [
	{
		name: "email",
		type: "string",
		required: true,
		description: "授权邮箱，需已在后台登记。服务端会基于此邮箱读取 API 配置。",
	},
	{
		name: "text",
		type: "string",
		required: true,
		description: "需要进行外链分析的英文文本。",
	},
	{
		name: "fingerprint",
		type: "string",
		required: false,
		description: "匿名访客可选指纹，用于限流识别。",
	},
	{
		name: "blacklist",
		type: "string[] | string",
		required: false,
		description: "需排除的域名，可传字符串数组或以逗号分隔的字符串。",
	},
	{
		name: "preferredSites",
		type: "string[] | string",
		required: false,
		description: "优先推荐的域名，支持数组或逗号分隔。",
	},
];

const responseFields = [
	{
		name: "success",
		description: "布尔值，表示请求是否成功。",
	},
	{
		name: "data.keywords[].keyword",
		description: "关键词文本。",
	},
	{
		name: "data.keywords[].query",
		description: "建议用于搜索引擎的查询语句。",
	},
	{
		name: "data.keywords[].reason",
		description: "推荐该外链的理由。",
	},
	{
		name: "data.keywords[].link",
		description: "主推荐链接，可能为空。",
	},
	{
		name: "data.keywords[].title",
		description: "主链接标题。",
	},
	{
		name: "data.keywords[].alternatives.preferred",
		description: "优先候选链接数组。",
	},
	{
		name: "data.keywords[].alternatives.regular",
		description: "常规候选链接数组。",
	},
	{
		name: "data.usage.promptTokens",
		description: "提示词 Token 数。",
	},
	{
		name: "data.usage.completionTokens",
		description: "生成 Token 数。",
	},
	{
		name: "data.usage.totalTokens",
		description: "总 Token 数。",
	},
	{
		name: "data.linkFetchError",
		description: "抓取外链时的错误信息，成功时为 `null`。",
	},
	{
		name: "error",
		description:
			"当 `success=false` 时出现，包含 `code`、`message` 与可选 `details`。",
	},
];

const exampleCommand = `POST https://YOUR_DOMAIN/api/external-links
Content-Type: application/json
x-token: YOUR_X_TOKEN

{
  "email": "user@example.com",
  "text": "Search engine optimization is crucial",
  "preferredSites": ["moz.com"],
  "blacklist": ["example.com"]
}`;

const usageSteps = [
	{
		title: "准备授权邮箱与 Token",
		description:
			"在后台添加授权邮箱后，点击“查看密钥”复制对应的 x-token。该 Token 与邮箱绑定，丢失需重新生成。",
	},
	{
		title: "构造请求",
		description:
			"请求体包含 email 与 text 等字段，Header 需携带 Content-Type 和 x-token。可在 Postman、curl 或任何 HTTP 客户端中发送。",
	},
	{
		title: "处理响应",
		description:
			"成功响应会返回 keywords、usage 以及可选的 linkFetchError；失败时根据 error.code 判定是限流、鉴权还是 AI 服务异常。",
	},
];

export default function GuidePage() {
	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="w-full py-16">
					<div className="mx-auto max-w-4xl space-y-10 px-4">
						<header className="space-y-3 text-center">
							<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.3em]">
								API GUIDE
							</p>
							<h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
								外链 API 参数说明
							</h1>
							<p className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg">
								所有请求均使用 POST + JSON，并在 Header 中携带
								`x-token`。以下内容展示完整参数与示例，复制后即可在 Postman 或
								curl 中直接调用。
							</p>
						</header>

						<div className="grid gap-6">
							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
										Headers
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										请求头要求
									</h2>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											<tr>
												<th className="px-4 py-3">Header</th>
												<th className="px-4 py-3">类型</th>
												<th className="px-4 py-3">必填</th>
												<th className="px-4 py-3">说明</th>
											</tr>
										</thead>
										<tbody>
											{headerRequirements.map((item) => (
												<tr
													key={item.name}
													className="border-border/60 border-t"
												>
													<td className="px-4 py-3 font-mono text-foreground text-sm">
														{item.name}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{item.type}
													</td>
													<td className="px-4 py-3 font-medium text-foreground">
														{item.required ? "✅" : "—"}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{item.description}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>

							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
										Body
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										JSON 请求体字段
									</h2>
									<p className="text-muted-foreground text-sm">
										`blacklist` 与 `preferredSites`
										支持数组或逗号分隔字符串，服务端会自动去重。
									</p>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											<tr>
												<th className="px-4 py-3">字段</th>
												<th className="px-4 py-3">类型</th>
												<th className="px-4 py-3">必填</th>
												<th className="px-4 py-3">说明</th>
											</tr>
										</thead>
										<tbody>
											{bodyFields.map((item) => (
												<tr
													key={item.name}
													className="border-border/60 border-t"
												>
													<td className="px-4 py-3 font-mono text-foreground text-sm">
														{item.name}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{item.type}
													</td>
													<td className="px-4 py-3 font-medium text-foreground">
														{item.required ? "✅" : "—"}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{item.description}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>

							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
										Usage
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										调用步骤
									</h2>
									<p className="text-muted-foreground text-sm">
										确保邮箱与 Token 一致，否则接口会返回 UNAUTHORIZED。
									</p>
								</div>
								<ol className="space-y-3">
									{usageSteps.map((step, index) => (
										<li
											key={step.title}
											className="flex gap-4 rounded-xl border border-border/60 bg-muted/20 p-4"
										>
											<div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background font-semibold text-foreground">
												{index + 1}
											</div>
											<div>
												<h3 className="font-semibold text-base text-foreground">
													{step.title}
												</h3>
												<p className="text-muted-foreground text-sm">
													{step.description}
												</p>
											</div>
										</li>
									))}
								</ol>
							</section>

							<section className="space-y-4 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-background p-6 shadow-sm backdrop-blur">
								<div>
									<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
										Example
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										完整请求示例
									</h2>
									<p className="text-muted-foreground text-sm">
										将 `YOUR_DOMAIN`、`YOUR_X_TOKEN`、`YOUR_ACCESS_KEY`
										等占位符替换为实际值即可在 Postman 或 curl 中使用。
									</p>
								</div>
								<div className="relative">
									<CopyCommandButton
										value={exampleCommand}
										copyLabel="复制示例"
										copiedLabel="已复制"
										className="absolute top-3 right-3"
									/>
									<pre className="overflow-x-auto rounded-xl border border-border/60 bg-background/80 p-4 text-muted-foreground text-sm">
										<code>{exampleCommand}</code>
									</pre>
								</div>
							</section>

							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
										Response
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										响应字段
									</h2>
									<p className="text-muted-foreground text-sm">
										当 `success=false` 时，`error` 对象会提供具体的失败原因。
									</p>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											<tr>
												<th className="px-4 py-3">字段</th>
												<th className="px-4 py-3">说明</th>
											</tr>
										</thead>
										<tbody>
											{responseFields.map((item) => (
												<tr
													key={item.name}
													className="border-border/60 border-t"
												>
													<td className="px-4 py-3 font-mono text-foreground text-sm">
														{item.name}
													</td>
													<td className="px-4 py-3 text-muted-foreground">
														{item.description}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
