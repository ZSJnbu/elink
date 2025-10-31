"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyAccessKeyButtonProps {
	value: string;
	label: string;
	copiedLabel: string;
}

export function CopyAccessKeyButton({
	value,
	label,
	copiedLabel,
}: CopyAccessKeyButtonProps) {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("复制密钥失败", error);
		}
	};

	return (
		<Button
			type="button"
			variant={copied ? "default" : "outline"}
			onClick={handleCopy}
			className="gap-2"
		>
			{copied ? (
				<Check className="h-4 w-4" />
			) : (
				<Copy className="h-4 w-4" />
			)}
			<span>{copied ? copiedLabel : label}</span>
		</Button>
	);
}
