"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
	messages: {
		emailLabel: string;
		emailPlaceholder: string;
		submitButton: string;
		sendingButton: string;
		successTitle: string;
		successDescription: string;
		errorTitle: string;
		errorDescription: string;
		invalidEmailTitle: string;
		invalidEmailDescription: string;
	};
	onSubmit: (email: string) => Promise<{ redirectTo: string }>;
}

export function LoginForm({ messages, onSubmit }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// 防止重复提交
		if (isLoading || !email) return;
		const trimmedEmail = email.trim();
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailPattern.test(trimmedEmail)) {
			toast({
				title: messages.invalidEmailTitle,
				description: messages.invalidEmailDescription,
				variant: "destructive",
			});
			return;
		}

		setEmail(trimmedEmail);
		setIsLoading(true);

		try {
			const result = await onSubmit(trimmedEmail);

			// 显示成功提示
			toast({
				title: messages.successTitle,
				description: messages.successDescription,
			});

			router.push(result.redirectTo);
		} catch (error) {
			// 显示错误提示
			toast({
				title: messages.errorTitle,
				description: messages.errorDescription,
				variant: "destructive",
			});

			// 出错时重置加载状态，允许用户重试
			setIsLoading(false);
			return;
		}
		// 成功时保持加载状态，避免用户多次点击
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="email" className="font-medium text-sm">
					{messages.emailLabel}
				</Label>
				<Input
					type="email"
					id="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={messages.emailPlaceholder}
					required
					disabled={isLoading}
					className="transition-colors focus:ring-2"
				/>
			</div>
			<Button
				type="submit"
				disabled={isLoading}
				className="w-full font-medium transition-colors hover:opacity-90"
			>
				{isLoading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						{messages.sendingButton}
					</>
				) : (
					messages.submitButton
				)}
			</Button>
		</form>
	);
}
