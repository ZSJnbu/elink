"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

function hasSignInError(redirectUrl: string | undefined) {
	if (!redirectUrl) {
		return false;
	}

	try {
		const url = new URL(redirectUrl);
		return Boolean(url.searchParams.get("error"));
	} catch (error) {
		console.warn("Failed to parse sign-in redirect URL", error);
		return false;
	}
}

export async function signInWithEmail(
	email: string,
): Promise<{ redirectTo: string }> {
	try {
		const redirectUrl = (await signIn("email-login", {
			email,
			redirect: false,
		})) as string | undefined;

		if (hasSignInError(redirectUrl)) {
			throw new Error("登录失败，请重试");
		}

		return { redirectTo: redirectUrl ?? "/editor" };
	} catch (error) {
		console.error("Sign in error:", error);
		throw new Error("登录失败，请重试");
	}
}

export async function signInWithAdminCredentials(
	username: string,
	password: string,
): Promise<{ redirectTo: string }> {
	try {
		const redirectUrl = (await signIn("admin-credentials", {
			username,
			password,
			redirect: false,
		})) as string | undefined;

		if (hasSignInError(redirectUrl)) {
			throw new Error("管理员登录失败");
		}

		return { redirectTo: redirectUrl ?? "/admin" };
	} catch (error) {
		console.error("Admin sign in error:", error);
		throw new Error("管理员登录失败");
	}
}

export async function signOutUser() {
	await signOut({ redirect: false });
	redirect("/");
}
