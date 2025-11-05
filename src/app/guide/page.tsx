import { getTranslations } from "next-intl/server";
import { CopyCommandButton } from "@/components/guide/copy-command-button";
import SiteHeader from "@/components/layout/site-header";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const exampleCommand = `POST https://YOUR_DOMAIN/api/external-links
Content-Type: application/json
x-token: YOUR_X_TOKEN

{
  "email": "user@example.com",
  "text": "Search engine optimization is crucial",
  "preferredSites": ["moz.com"],
  "blacklist": ["example.com"]
}`;

export default async function GuidePage() {
	const t = await getTranslations("guidePage");
	const headerRequirements = [
		{
			name: "Content-Type",
			type: "string",
			required: true,
			description: t("headers.requirements.contentType"),
		},
		{
			name: "x-token",
			type: "string",
			required: true,
			description: t("headers.requirements.token"),
		},
	] as const;
	const bodyFields = [
		{
			name: "email",
			type: "string",
			required: true,
			description: t("body.fields.email"),
		},
		{
			name: "text",
			type: "string",
			required: true,
			description: t("body.fields.text"),
		},
		{
			name: "fingerprint",
			type: "string",
			required: false,
			description: t("body.fields.fingerprint"),
		},
		{
			name: "blacklist",
			type: "string[] | string",
			required: false,
			description: t("body.fields.blacklist"),
		},
		{
			name: "preferredSites",
			type: "string[] | string",
			required: false,
			description: t("body.fields.preferredSites"),
		},
	] as const;
	const responseFields = [
		{
			name: "success",
			description: t("response.fields.success"),
		},
		{
			name: "data.keywords[].keyword",
			description: t("response.fields.keyword"),
		},
		{
			name: "data.keywords[].query",
			description: t("response.fields.query"),
		},
		{
			name: "data.keywords[].reason",
			description: t("response.fields.reason"),
		},
		{
			name: "data.keywords[].link",
			description: t("response.fields.link"),
		},
		{
			name: "data.keywords[].title",
			description: t("response.fields.title"),
		},
		{
			name: "data.keywords[].alternatives.preferred",
			description: t("response.fields.preferred"),
		},
		{
			name: "data.keywords[].alternatives.regular",
			description: t("response.fields.regular"),
		},
		{
			name: "data.usage.promptTokens",
			description: t("response.fields.promptTokens"),
		},
		{
			name: "data.usage.completionTokens",
			description: t("response.fields.completionTokens"),
		},
		{
			name: "data.usage.totalTokens",
			description: t("response.fields.totalTokens"),
		},
		{
			name: "data.linkFetchError",
			description: t("response.fields.linkFetchError"),
		},
		{
			name: "error",
			description: t("response.fields.error"),
		},
	] as const;
	const usageSteps = [
		{
			title: t("usage.steps.prepare.title"),
			description: t("usage.steps.prepare.description"),
		},
		{
			title: t("usage.steps.build.title"),
			description: t("usage.steps.build.description"),
		},
		{
			title: t("usage.steps.handle.title"),
			description: t("usage.steps.handle.description"),
		},
	] as const;
	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="w-full py-16">
					<div className="mx-auto max-w-4xl space-y-10 px-4">
						<header className="space-y-3 text-center">
							<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.3em]">
								{t("hero.badge")}
							</p>
							<h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
								{t("hero.title")}
							</h1>
							<p className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg">
								{t("hero.description")}
							</p>
						</header>

						<div className="grid gap-6">
							<section className="space-y-4 rounded-2xl border border-border/70 bg-background/50 p-6 shadow-sm backdrop-blur">
								<div>
									<p className="font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]">
										{t("headers.badge")}
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										{t("headers.title")}
									</h2>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											<tr>
												<th className="px-4 py-3">
													{t("headers.columns.header")}
												</th>
												<th className="px-4 py-3">
													{t("headers.columns.type")}
												</th>
												<th className="px-4 py-3">
													{t("headers.columns.required")}
												</th>
												<th className="px-4 py-3">
													{t("headers.columns.description")}
												</th>
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
										{t("body.badge")}
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										{t("body.title")}
									</h2>
									<p className="text-muted-foreground text-sm">
										{t("body.description")}
									</p>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											<tr>
												<th className="px-4 py-3">
													{t("body.columns.field")}
												</th>
												<th className="px-4 py-3">
													{t("body.columns.type")}
												</th>
												<th className="px-4 py-3">
													{t("body.columns.required")}
												</th>
												<th className="px-4 py-3">
													{t("body.columns.description")}
												</th>
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
										{t("usage.badge")}
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										{t("usage.title")}
									</h2>
									<p className="text-muted-foreground text-sm">
										{t("usage.description")}
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
										{t("example.badge")}
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										{t("example.title")}
									</h2>
									<p className="text-muted-foreground text-sm">
										{t("example.description")}
									</p>
								</div>
								<div className="relative">
									<CopyCommandButton
										value={exampleCommand}
										copyLabel={t("example.copyLabel")}
										copiedLabel={t("example.copiedLabel")}
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
										{t("response.badge")}
									</p>
									<h2 className="font-semibold text-2xl text-foreground">
										{t("response.title")}
									</h2>
									<p className="text-muted-foreground text-sm">
										{t("response.description")}
									</p>
								</div>
								<div className="overflow-x-auto rounded-xl border border-border/60">
									<table className="min-w-full text-sm">
										<thead className="bg-muted/70 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
											<tr>
												<th className="px-4 py-3">
													{t("response.columns.field")}
												</th>
												<th className="px-4 py-3">
													{t("response.columns.description")}
												</th>
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
