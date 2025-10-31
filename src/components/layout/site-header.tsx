import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import LoginLogoutBtn from "@/components/auth/login-logout-btn";
import FeedbackDialog from "@/components/feedback/dialog";
import LocaleSwitcher from "@/components/locale/swither";
import SettingsButton from "@/components/settings/settings-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Logo from "./logo";

export default async function SiteHeader() {
	const session = await auth();
	const isAdmin = session?.user?.isAdmin;
	const t = await getTranslations("nav");

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
				{/* Logo */}
				<Logo />

				{/* Navigation */}
				<nav className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/checkout">{t("recharge")}</Link>
					</Button>
					{session?.user ? (
						<Button variant="ghost" size="sm" asChild>
							<Link href="/keys">{t("keys")}</Link>
						</Button>
					) : null}
					{isAdmin ? (
						<Button variant="ghost" size="sm" asChild>
							<Link href="/admin">{t("admin")}</Link>
						</Button>
					) : null}
					<FeedbackDialog />
					<SettingsButton />
					<ThemeToggle />
					<LocaleSwitcher />
					<LoginLogoutBtn />
				</nav>
			</div>
		</header>
	);
}
