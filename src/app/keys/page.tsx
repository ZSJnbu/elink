import { redirect } from "next/navigation";
import SiteHeader from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CopyAccessKeyButton } from "@/components/keys/copy-access-key-button";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getAccessKeyByEmail } from "@/server/api-keys/store";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function KeysPage() {
	const session = await auth();
	if (!session?.user?.email) {
		redirect("/login");
	}

	const email = session.user.email!;
	const t = await getTranslations("keys");
	const accessKeyRecord = await getAccessKeyByEmail(email);

	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
					<header className="space-y-2">
						<h1 className="text-3xl font-semibold text-foreground">
							{t("title")}
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							{t("description")}
						</p>
					</header>

					<Card>
						<CardHeader>
							<CardTitle>{t("cardTitle")}</CardTitle>
							<CardDescription>{t("helper")}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<p className="text-xs font-semibold uppercase text-muted-foreground">
									{t("emailLabel")}
								</p>
								<p className="mt-1 font-mono text-sm sm:text-base">{email}</p>
							</div>

							{accessKeyRecord ? (
								<div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0">
										<p className="text-xs font-semibold uppercase text-muted-foreground">
											{t("tokenLabel")}
										</p>
										<p className="mt-2 break-all font-mono text-base sm:text-lg">
											{accessKeyRecord.accessToken}
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											{t("tokenHelper")}
										</p>
									</div>
									<CopyAccessKeyButton
										value={accessKeyRecord.accessToken}
										label={t("tokenCta")}
										copiedLabel={t("tokenCopied")}
									/>
								</div>
							) : (
								<p className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
									{t("empty")}
								</p>
							)}
						</CardContent>
					</Card>
				</section>
			</main>
		</>
	);
}
