import { randomUUID } from "crypto";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { env } from "@/env";
import { redis } from "@/server/kv";

const ADMIN_USERNAME = env.ADMIN_PORTAL_USERNAME ?? "admin";
const ADMIN_PASSWORD = env.ADMIN_PORTAL_PASSWORD ?? "admin123";

const ADMIN_USER = {
	id: "admin",
	name: "Administrator",
	email: `${ADMIN_USERNAME}@local.dev`,
	role: "admin" as const,
};

async function seedAdminUser(adapter: Adapter) {
	const adminEmail = `${ADMIN_USERNAME}@local.dev`;

	if (!adapter.getUserByEmail || !adapter.createUser) {
		return;
	}

	const existing = await adapter.getUserByEmail(adminEmail);
	if (existing) {
		return;
	}

	await adapter.createUser({
		id: ADMIN_USER.id,
		name: ADMIN_USER.name,
		email: adminEmail,
		emailVerified: new Date(),
		role: ADMIN_USER.role,
	} as any);
}

/**
 * 触发用户注册事件，由 Plunk 自动发送验证邮件
 * @param params - 验证邮件参数
 * @throws {Error} 当发送验证邮件失败时抛出错误
 */
const adapter = UpstashRedisAdapter(redis);

await seedAdminUser(adapter);

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		Credentials({
			id: "admin-credentials",
			name: "Admin",
			credentials: {
				username: {
					label: "Username",
					type: "text",
					placeholder: "admin",
				},
				password: { label: "Password", type: "password" },
			},
	async authorize(credentials) {
		const username =
			typeof credentials?.username === "string"
				? credentials.username.trim()
				: "";
				const password =
					typeof credentials?.password === "string"
						? credentials.password
						: "";

				if (!username || !password) {
					return null;
				}

				if (
					username === ADMIN_USERNAME &&
					password === ADMIN_PASSWORD
				) {
					return ADMIN_USER;
				}

				return null;
			},
		}),
		Credentials({
			id: "email-login",
			name: "Email",
			credentials: {
				email: {
					label: "Email",
					type: "email",
					placeholder: "you@example.com",
				},
			},
			async authorize(credentials) {
				const email =
					typeof credentials?.email === "string"
						? credentials.email.trim().toLowerCase()
						: "";

				const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!email || !emailPattern.test(email)) {
					return null;
				}

				const existing = await adapter.getUserByEmail?.(email);
				if (existing) {
					return existing as AdapterUser;
				}

				const newUser = await adapter.createUser?.({
					id: randomUUID(),
					email,
					emailVerified: new Date(),
					role: "user",
				});

				return newUser ?? null;
			},
		}),
	],
	adapter,
	pages: {
		signIn: "/login",
		error: "/auth/error",
		verifyRequest: "/verify-request",
	},
	secret: env.AUTH_SECRET,
	session: {
		strategy: "jwt",
	},
	callbacks: {
		async jwt({ token, user }) {
			const resolveRole = (value: unknown): "admin" | "user" =>
				value === "admin" ? "admin" : "user";

			if (user) {
				const role = (user as { role?: string }).role;
				token.role = resolveRole(role);
			} else if (!token.role) {
				token.role = "user";
			}
			return token;
		},
		async session({ session, token }) {
				if (session.user) {
					if (token.sub) {
						session.user.id = token.sub;
					}
					const role = token.role === "admin" ? "admin" : "user";
					session.user.role = role;
					session.user.isAdmin = role === "admin";
				}
			return session;
		},
	},
});
