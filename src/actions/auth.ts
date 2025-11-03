"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

function isRedirectError(error: unknown): error is { digest: string } {
	return (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		(error as { digest?: string }).digest === "NEXT_REDIRECT"
	);
}

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

export async function signInWithEmail(email: string) {
	try {
		const redirectUrl = (await signIn("email-login", {
			email,
			redirect: false,
		})) as string | undefined;

		if (hasSignInError(redirectUrl)) {
			throw new Error("登录失败，请重试");
		}

		redirect("/editor");
	} catch (error) {
		if (isRedirectError(error)) {
			throw error;
		}

		console.error("Sign in error:", error);
		throw new Error("登录失败，请重试");
	}
}

export async function signInWithAdminCredentials(
	username: string,
	password: string,
) {
	try {
		const redirectUrl = (await signIn("admin-credentials", {
			username,
			password,
			redirect: false,
		})) as string | undefined;

		if (hasSignInError(redirectUrl)) {
			throw new Error("管理员登录失败");
		}

		redirect("/admin");
	} catch (error) {
		if (isRedirectError(error)) {
			throw error;
		}

		console.error("Admin sign in error:", error);
		throw new Error("管理员登录失败");
	}
}

export async function signOutUser() {
	await signOut({ redirect: false });
	redirect("/");
}
