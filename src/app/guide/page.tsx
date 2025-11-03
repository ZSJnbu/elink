import { getTranslations } from "next-intl/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function GuidePage() {
	const t = await getTranslations("guidePage");

	const gettingStartedKeys = ["env", "login", "editor", "settings", "billing"] as const;
	const webFeatureKeys = ["keywords", "history", "feedback"] as const;
	const apiParamKeys = ["text", "accessKey", "preferredSites", "blacklist", "model"] as const;
	const nextStepKeys = ["readme", "support"] as const;

	return (
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

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
							{t("sections.gettingStarted.title")}
						</h2>
						<ul className="list-disc space-y-2 pl-5 text-muted-foreground">
							{gettingStartedKeys.map((key) => (
								<li key={key}>{t(`sections.gettingStarted.items.${key}`)}</li>
							))}
						</ul>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
							{t("sections.webFeatures.title")}
						</h2>
						<ul className="list-disc space-y-2 pl-5 text-muted-foreground">
							{webFeatureKeys.map((key) => (
								<li key={key}>{t(`sections.webFeatures.items.${key}`)}</li>
							))}
						</ul>
					</section>

					<section className="space-y-4">
						<div className="space-y-2">
							<h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
								{t("api.title")}
							</h2>
							<p className="text-muted-foreground">{t("api.description")}</p>
						</div>
						<div className="space-y-2">
							<h3 className="text-lg font-semibold text-foreground">
								{t("api.paramsTitle")}
							</h3>
							<ul className="list-disc space-y-2 pl-5 text-muted-foreground">
								{apiParamKeys.map((key) => (
									<li key={key}>{t(`api.params.${key}`)}</li>
								))}
							</ul>
						</div>
						<div className="space-y-2">
							<h3 className="text-lg font-semibold text-foreground">
								{t("api.exampleTitle")}
							</h3>
							<pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/60 p-4 text-sm text-muted-foreground">
								<code>{t("api.example")}</code>
							</pre>
						</div>
					</section>

					<section className="space-y-3">
						<h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
							{t("nextStepsTitle")}
						</h2>
						<ul className="list-disc space-y-2 pl-5 text-muted-foreground">
							{nextStepKeys.map((key) => (
								<li key={key}>{t(`nextSteps.${key}`)}</li>
							))}
						</ul>
					</section>
				</div>
			</section>
		</main>
	);
}
