import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AccessKeyManager } from "@/components/admin/access-key-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAccessKeys } from "@/server/api-keys/store";
import { listBalances } from "@/server/billing/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
	const session = await auth();
	if (!session?.user?.isAdmin) {
		redirect("/");
	}

const t = await getTranslations("admin");

	const records = await listAccessKeys();
	const balances = await listBalances();

	const balanceMap = new Map(balances.map((item) => [item.email, item.balance]));

	const latestRecordsMap = new Map<string, (typeof records)[number]>();

	for (const record of records) {
		const existing = latestRecordsMap.get(record.email);
		if (
			!existing ||
			new Date(record.createdAt).getTime() >
				new Date(existing.createdAt).getTime()
		) {
			latestRecordsMap.set(record.email, record);
		}
	}

	const keys = Array.from(latestRecordsMap.values()).map((record) => ({
		id: record.id,
		email: record.email,
		createdAt: record.createdAt,
		createdBy: record.createdBy,
		hashPreview: record.hash.slice(0, 10),
		balance: balanceMap.get(record.email) ?? 0,
	}));

	const keyEmails = new Set(keys.map((key) => key.email));
	const orphanBalances = balances.filter(
		(balance) => !keyEmails.has(balance.email),
	);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-8">
			<div>
				<h1 className="text-2xl font-bold">{t("title")}</h1>
				<p className="text-sm text-muted-foreground">
					{t("description")}
				</p>
				<div className="mt-4">
					<Button variant="outline" asChild>
						<Link href="/">{t("backHome")}</Link>
					</Button>
				</div>
			</div>
			<AccessKeyManager keys={keys} />
			{orphanBalances.length > 0 ? (
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>{t("orphan.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							{t("orphan.description")}
						</p>
						<div className="space-y-2">
							{orphanBalances.map((balance) => (
								<div
									key={balance.email}
									className="flex items-center justify-between rounded-md border p-3"
								>
									<span className="text-sm font-medium">
										{balance.email}
									</span>
									<span className="text-sm text-muted-foreground">
										{t("orphan.balance", {
											value: balance.balance.toFixed(2),
										})}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
