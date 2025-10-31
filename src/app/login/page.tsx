import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { signInWithAdminCredentials, signInWithEmail } from "@/actions/auth";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default async function SignIn() {
	// 检查用户是否已登录
	const session = await auth();
	if (session?.user) {
		redirect("/");
	}

	const t = await getTranslations("auth.loginPage");

	return (
		<div className="flex min-h-screen items-center justify-center bg-background/50 p-4">
			<Card className="w-full max-w-[400px] shadow-lg">
				<CardHeader className="space-y-1">
					<CardTitle className="font-bold text-2xl">{t("title")}</CardTitle>
					<CardDescription className="text-base">
						{t("description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="email" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="email">邮箱登录</TabsTrigger>
							<TabsTrigger value="admin">管理员登录</TabsTrigger>
						</TabsList>
						<TabsContent value="email" className="pt-4">
							<LoginForm
								messages={{
									emailLabel: t("email.label"),
									emailPlaceholder: t("email.placeholder"),
									submitButton: t("email.submit"),
									sendingButton: t("email.sending"),
									successTitle: t("email.successTitle"),
									successDescription: t("email.successDescription"),
									errorTitle: t("email.errorTitle"),
									errorDescription: t("email.errorDescription"),
								}}
								onSubmit={signInWithEmail}
							/>
						</TabsContent>
						<TabsContent value="admin" className="pt-4">
							<AdminLoginForm onSubmit={signInWithAdminCredentials} />
						</TabsContent>
					</Tabs>
					<div className="mt-6 text-center">
						<Button variant="ghost" asChild>
							<Link href="/">返回首页</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
