import SiteHeader from "@/components/layout/site-header";
import { CopyCommandButton } from "@/components/guide/copy-command-button";

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
		name: "accessKey",
		type: "string",
		required: true,
		description: "管理后台或“密钥”页面颁发的访问密钥。",
	},
	{
		name: "text",
		type: "string",
		required: true,
		description: "需要进行外链分析的英文文本。",
	},
	{
		name: "apiKey",
		type: "string",
		required: false,
		description: "自定义模型使用的 API Key；缺省时使用服务端配置的 `OPENAI_API_KEY`。",
	},
	{
		name: "baseUrl",
		type: "string",
		required: false,
		description: "自定义模型兼容接口地址（HTTP/HTTPS）。",
	},
	{
		name: "model",
		type: "string",
		required: false,
		description: "模型名称，如 `gpt-4o-mini`、`qwen3-vl-plus` 等。",
	},
	{
		name: "provider",
		type: '"openai" | "custom"',
		required: false,
		description: "模型提供方。使用 `custom` 时必须配合 `apiKey`（可选 `baseUrl`）。",
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

const exampleCommand = `POST https://YOUR_DOMAIN/api/external-links
Content-Type: application/json
x-token: YOUR_X_TOKEN

{
  "accessKey": "YOUR_ACCESS_KEY",
  "text": "Search engine optimization is crucial",
  "provider": "custom",
  "model": "qwen3-vl-plus",
  "apiKey": "YOUR_MODEL_API_KEY",
  "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "preferredSites": ["moz.com"],
  "blacklist": ["example.com"]
}`;

export default function GuidePage() {
	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="w-full py-16">
					<div className="mx-auto max-w-4xl space-y-10 px-4">
						<header className="space-y-3 text-center">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
								API GUIDE
							</p>
							<h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
								外链 API 参数说明
							</h1>
							<p className="max-w-3xl mx-auto text-base text-muted-foreground sm:text-lg">
								所有请求均使用 POST + JSON，并在 Header 中携带 `x-token`。以下内容展示完整参数与示例，复制后即可在 Postman 或
								curl 中直接调用。
							</p>
						</header>

						<div className="grid gap-6">
							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Headers
									</p>
									<h2 className="text-2xl font-semibold text-foreground">请求头要求</h2>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											<tr>
												<th className="px-4 py-3">Header</th>
												<th className="px-4 py-3">类型</th>
												<th className="px-4 py-3">必填</th>
												<th className="px-4 py-3">说明</th>
											</tr>
										</thead>
										<tbody>
											{headerRequirements.map((item) => (
												<tr key={item.name} className="border-t border-border/60">
													<td className="px-4 py-3 font-mono text-sm text-foreground">{item.name}</td>
													<td className="px-4 py-3 text-muted-foreground">{item.type}</td>
													<td className="px-4 py-3 font-medium text-foreground">
														{item.required ? "✅" : "—"}
													</td>
													<td className="px-4 py-3 text-muted-foreground">{item.description}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>

							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Body
									</p>
									<h2 className="text-2xl font-semibold text-foreground">JSON 请求体字段</h2>
									<p className="text-sm text-muted-foreground">
										`blacklist` 与 `preferredSites` 支持数组或逗号分隔字符串，服务端会自动去重。
									</p>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											<tr>
												<th className="px-4 py-3">字段</th>
												<th className="px-4 py-3">类型</th>
												<th className="px-4 py-3">必填</th>
												<th className="px-4 py-3">说明</th>
											</tr>
										</thead>
										<tbody>
											{bodyFields.map((item) => (
												<tr key={item.name} className="border-t border-border/60">
													<td className="px-4 py-3 font-mono text-sm text-foreground">{item.name}</td>
													<td className="px-4 py-3 text-muted-foreground">{item.type}</td>
													<td className="px-4 py-3 font-medium text-foreground">
														{item.required ? "✅" : "—"}
													</td>
													<td className="px-4 py-3 text-muted-foreground">{item.description}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>

							<section className="space-y-4 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-background p-6 shadow-sm backdrop-blur">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Example
									</p>
									<h2 className="text-2xl font-semibold text-foreground">完整请求示例</h2>
									<p className="text-sm text-muted-foreground">
										将 `YOUR_DOMAIN`、`YOUR_X_TOKEN`、`YOUR_ACCESS_KEY` 等占位符替换为实际值即可在 Postman 或 curl 中使用。
									</p>
								</div>
								<div className="relative">
									<CopyCommandButton
										value={exampleCommand}
										copyLabel="复制示例"
										copiedLabel="已复制"
										className="absolute right-3 top-3"
									/>
									<pre className="overflow-x-auto rounded-xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
										<code>{exampleCommand}</code>
									</pre>
								</div>
							</section>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
