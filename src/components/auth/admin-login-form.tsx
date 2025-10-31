"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginFormProps {
	onSubmit: (username: string, password: string) => Promise<void>;
}

export function AdminLoginForm({ onSubmit }: AdminLoginFormProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isPending, startTransition] = useTransition();
	const { toast } = useToast();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (isPending || !username || !password) {
			return;
		}

		startTransition(async () => {
			try {
				await onSubmit(username, password);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("NEXT_REDIRECT")
				) {
					return;
				}

				console.error("Admin login failed", error);
				toast({
					title: "登录失败",
					description: "请检查用户名和密码是否正确",
					variant: "destructive",
				});
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="admin-username" className="font-medium text-sm">
					管理员账号
				</Label>
				<Input
					id="admin-username"
					name="username"
					placeholder="admin"
					value={username}
					onChange={(event) => setUsername(event.target.value)}
					required
					disabled={isPending}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="admin-password" className="font-medium text-sm">
					密码
				</Label>
				<Input
					id="admin-password"
					name="password"
					type="password"
					placeholder="••••••••"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
					disabled={isPending}
				/>
			</div>
			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						正在登录...
					</>
				) : (
					"管理员登录"
				)}
			</Button>
		</form>
	);
}
