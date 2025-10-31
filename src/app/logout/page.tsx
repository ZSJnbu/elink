import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { signOutUser } from "@/actions/auth";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function LogoutPage() {
	const session = await auth();

	if (!session?.user?.email) {
		redirect("/");
	}

const t = await getTranslations("logout");

	return (
		<div className="flex min-h-screen items-center justify-center bg-background/50 p-4">
			<Card className="w-full max-w-[400px] shadow-lg">
				<CardHeader className="space-y-1">
					<CardTitle className="font-bold text-2xl">
						{t("title")}
					</CardTitle>
					<CardDescription className="text-base">
						{t("description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form action={signOutUser} className="space-y-2">
						<Button type="submit" className="w-full">
							{t("confirm")}
						</Button>
						<Button variant="outline" className="w-full" asChild>
							<Link href="/">{t("cancel")}</Link>
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
