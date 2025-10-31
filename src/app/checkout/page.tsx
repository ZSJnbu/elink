import { auth } from "@/auth";
import { getBalanceForEmail } from "@/actions/billing";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { TopUpForm } from "@/components/billing/top-up-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CheckoutPage() {
	const session = await auth();
	const email = session?.user?.email ?? null;
	const balance = await getBalanceForEmail(email);
const t = await getTranslations("checkout");

	return (
		<div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
			<Card className="shadow-md">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold">
						{t("title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
				<TopUpForm defaultEmail={email} initialBalance={balance} />
					<div className="mt-6 text-center">
						<Button variant="ghost" asChild>
							<Link href="/">{t("backHome")}</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
