import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/layout/site-header";
import { CopyCommandButton } from "@/components/guide/copy-command-button";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function GuidePage() {
	const t = await getTranslations("guidePage");
	const paramKeys = ["text", "model", "apiKey", "baseUrl", "provider", "accessKey"] as const;
	const params = paramKeys.map((key) => ({
		key,
		param: t(`api.table.rows.${key}.param`),
		required: t(`api.table.rows.${key}.required`),
		description: t(`api.table.rows.${key}.description`),
	}));
	const curlDefault = t("api.curlDefault");
	const curlProxy = t("api.curlProxy");
	const copyLabel = t("api.copyLabel");
	const copiedLabel = t("api.copiedLabel");

	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="w-full py-16">
					<div className="mx-auto max-w-4xl space-y-10 px-4">
						<header className="space-y-3">
							<h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
								{t("title")}
							</h1>
							<p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
								{t("intro")}
							</p>
						</header>

						<section className="space-y-6">
							<div className="space-y-3">
								<h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
									{t("api.title")}
								</h2>
								<p className="text-muted-foreground">{t("api.description")}</p>
							</div>
							<div className="space-y-4">
								<div className="space-y-2">
									<h3 className="text-lg font-semibold text-foreground">
										{t("api.curlDefaultTitle")}
									</h3>
									<div className="relative">
										<CopyCommandButton
											value={curlDefault}
											copyLabel={copyLabel}
											copiedLabel={copiedLabel}
											className="absolute right-3 top-3"
										/>
										<pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/60 p-4 text-sm text-muted-foreground">
											<code>{curlDefault}</code>
										</pre>
									</div>
								</div>
								<div className="space-y-2">
									<h3 className="text-lg font-semibold text-foreground">
										{t("api.curlProxyTitle")}
									</h3>
									<div className="relative">
										<CopyCommandButton
											value={curlProxy}
											copyLabel={copyLabel}
											copiedLabel={copiedLabel}
											className="absolute right-3 top-3"
										/>
										<pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/60 p-4 text-sm text-muted-foreground">
											<code>{curlProxy}</code>
										</pre>
									</div>
								</div>
								<p className="text-sm text-muted-foreground">{t("api.note")}</p>
							</div>
							<div className="space-y-3">
								<h3 className="text-lg font-semibold text-foreground">
									{t("api.tableTitle")}
								</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full table-auto border-collapse text-sm">
										<thead>
											<tr className="bg-muted/60 text-left">
												<th className="border border-border/60 px-4 py-2 font-medium text-foreground">
													{t("api.table.headers.param")}
												</th>
												<th className="border border-border/60 px-4 py-2 font-medium text-foreground">
													{t("api.table.headers.required")}
												</th>
												<th className="border border-border/60 px-4 py-2 font-medium text-foreground">
													{t("api.table.headers.description")}
												</th>
											</tr>
										</thead>
										<tbody>
											{params.map((row) => (
												<tr key={row.key} className="odd:bg-background even:bg-muted/20">
													<td className="border border-border/60 px-4 py-2 font-mono text-sm text-foreground">
														{row.param}
													</td>
													<td className="border border-border/60 px-4 py-2 text-foreground">
														{row.required}
													</td>
													<td className="border border-border/60 px-4 py-2 text-muted-foreground">
														{row.description}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</section>
					</div>
				</section>
			</main>
		</>
	);
}
