import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: DefaultSession["user"] & {
			id?: string;
			role?: "admin" | "user";
			isAdmin?: boolean;
		};
	}

	interface User {
		role?: "admin" | "user";
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		role?: "admin" | "user";
	}
}
