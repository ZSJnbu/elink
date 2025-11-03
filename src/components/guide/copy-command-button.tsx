"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyCommandButtonProps {
	value: string;
	copyLabel: string;
	copiedLabel: string;
	className?: string;
}

export function CopyCommandButton({
	value,
	copyLabel,
	copiedLabel,
	className,
}: CopyCommandButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("复制命令失败", error);
		}
	};

	return (
		<Button
			type="button"
			variant={copied ? "default" : "outline"}
			size="sm"
			onClick={handleCopy}
			className={cn("gap-2", className)}
			aria-label={copied ? copiedLabel : copyLabel}
		>
			{copied ? (
				<Check className="h-4 w-4" />
			) : (
				<Copy className="h-4 w-4" />
			)}
			<span>{copied ? copiedLabel : copyLabel}</span>
		</Button>
	);
}

