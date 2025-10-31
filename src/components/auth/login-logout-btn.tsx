import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function LoginLogoutBtn() {
	const session = await auth();
	const t = await getTranslations("auth");
	const isAuthenticated = !!session?.user?.email;

	if (isAuthenticated) {
		return (
			<Button variant="ghost" size="sm" className="gap-2" asChild>
				<Link href="/logout">{t("logout")}</Link>
			</Button>
		);
	}

	return (
		<Button variant="ghost" size="sm" className="gap-2" asChild>
			<Link href="/login">{t("login")}</Link>
		</Button>
	);
}
