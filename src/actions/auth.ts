"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

export async function signInWithEmail(email: string) {
	try {
		await signIn("email-login", { email, redirect: true });
	} catch (error) {
		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
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
		await signIn("admin-credentials", {
			username,
			password,
			redirect: true,
			redirectTo: "/admin",
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
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
