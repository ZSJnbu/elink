import Link from "next/link";
import SiteHeader from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { getMessages } from "./messages";

export const runtime = "edge";

export default async function Home() {
	const messages = await getMessages();
	const featureItems = [
		messages.features.ai,
		messages.features.links,
		messages.features.optimization,
	];

	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="relative isolate flex min-h-[calc(100vh-3.5rem)] w-full items-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
					<div className="pointer-events-none absolute -top-24 right-1/2 h-64 w-64 translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
					<div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/25 blur-3xl" />

					<div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-10 lg:py-24">
						<div className="flex flex-col justify-center gap-8 text-left">
							<span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
								{messages.home.hero.badge}
							</span>
							<div className="space-y-4">
								<h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
									{messages.home.hero.title}
								</h1>
								<p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
									{messages.home.hero.subtitle}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-4">
								<Button size="lg" asChild>
									<Link href="/editor">{messages.home.hero.cta}</Link>
								</Button>
								<Button size="lg" variant="outline" asChild>
									<a href="#features">{messages.home.hero.secondaryCta}</a>
								</Button>
							</div>
							<div
								id="features"
								className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3"
							>
								{featureItems.map((feature) => (
									<div
										key={feature.title}
										className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm backdrop-blur-sm"
									>
										<h3 className="text-sm font-semibold text-foreground">
											{feature.title}
										</h3>
										<p className="mt-2 text-sm text-muted-foreground">
											{feature.description}
										</p>
									</div>
								))}
							</div>
						</div>

						<div className="relative">
							<div className="pointer-events-none absolute inset-x-6 top-8 h-40 rounded-full bg-primary/20 blur-3xl" />
							<div className="relative rounded-3xl border border-border/50 bg-background/70 p-6 shadow-2xl backdrop-blur">
								<div className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
									<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
										1
									</span>
									{messages.form.title}
								</div>
								<p className="text-sm text-muted-foreground">
									{messages.form.description}
								</p>

								<div className="mt-6 space-y-4">
									<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
										<p className="text-xs font-medium uppercase tracking-wide text-primary">
											{messages.preview.description}
										</p>
										<p className="mt-2 text-sm text-muted-foreground">
											{messages.linkedContent.description}
										</p>
									</div>

									<div className="rounded-xl border border-border/60 bg-background/90 p-4">
										<h4 className="text-sm font-semibold text-foreground">
											{messages.header.title}
										</h4>
										<p className="mt-2 text-sm text-muted-foreground">
											{messages.header.description}
										</p>
										<div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
											<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
												✓
											</span>
											{featureItems[0]?.title}
										</div>
										<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
											<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
												✓
											</span>
											{featureItems[1]?.title}
										</div>
									</div>
								</div>

							</div>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
