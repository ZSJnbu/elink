"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
	updateTokenPricingAction,
	type TokenPricingActionState,
} from "@/actions/admin/pricing";

interface TokenPricingCardProps {
	price: number;
	updatedAt?: string;
	updatedBy?: string;
	currentUserEmail?: string;
}

function formatUpdatedInfo(updatedAt?: string, updatedBy?: string): string | null {
	if (!updatedAt) return null;

	const date = new Date(updatedAt);
	const timestamp = date.getTime();
	if (Number.isNaN(timestamp) || timestamp <= 0) {
		return updatedBy ?? null;
	}

	const formatted = date.toLocaleString();
	if (updatedBy) {
		return `${formatted} · ${updatedBy}`;
	}
	return formatted;
}

const INITIAL_PRICING_STATE: TokenPricingActionState = {
	status: "idle",
};

export function TokenPricingCard({
	price,
	updatedAt,
	updatedBy,
	currentUserEmail,
}: TokenPricingCardProps) {
	const t = useTranslations("admin.pricing");
	const { toast } = useToast();
	const [inputValue, setInputValue] = useState(() => price.toString());
	const [localUpdatedAt, setLocalUpdatedAt] = useState(updatedAt);
	const [localUpdatedBy, setLocalUpdatedBy] = useState(updatedBy);
	const [state, formAction] = useActionState<
		TokenPricingActionState,
		FormData
	>(updateTokenPricingAction, INITIAL_PRICING_STATE);

	useEffect(() => {
		if (state.status === "success") {
			toast({
				title: t("toast.successTitle"),
				description: t("toast.successDescription"),
			});
			if (typeof state.price === "number") {
				setInputValue(state.price.toFixed(2));
			}
			setLocalUpdatedAt(new Date().toISOString());
			setLocalUpdatedBy((prev) => currentUserEmail ?? prev ?? undefined);
		} else if (state.status === "error") {
			const description =
				state.code === "invalid"
					? t("toast.invalid")
					: state.code === "unauthorized"
						? t("toast.unauthorized")
						: t("toast.errorDescription");
			toast({
				title: t("toast.errorTitle"),
				description,
				variant: "destructive",
			});
		}
	}, [state.status, state.code, state.price, currentUserEmail, t, toast]);

	useEffect(() => {
		setInputValue(price.toString());
		setLocalUpdatedAt(updatedAt);
		setLocalUpdatedBy(updatedBy);
	}, [price, updatedAt, updatedBy]);

	const lastUpdatedText = useMemo(
		() => formatUpdatedInfo(localUpdatedAt, localUpdatedBy),
		[localUpdatedAt, localUpdatedBy],
	);

	return (
		<Card>
			<CardHeader className="space-y-4">
				<div>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</div>
				{lastUpdatedText ? (
					<p className="text-xs text-muted-foreground">
						{t("lastUpdated", { value: lastUpdatedText })}
					</p>
				) : null}
			</CardHeader>
			<CardContent>
				<form
					action={formAction}
					className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3"
				>
					<div className="flex-1 space-y-2">
						<label className="block text-sm font-medium text-foreground">
							{t("inputLabel")}
						</label>
						<Input
							name="price"
							type="number"
							min="0.01"
							step="0.01"
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							required
						/>
					</div>
					<SubmitButton />
				</form>
			</CardContent>
		</Card>
	);
}

function SubmitButton() {
	const t = useTranslations("admin.pricing");
	const { pending } = useFormStatus();
	return (
		<Button type="submit" className="sm:w-auto" disabled={pending}>
			{pending ? t("updating") : t("update")}
		</Button>
	);
}
