"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
	getPaymentOrderStatusAction,
	topUpBalanceAction,
} from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface TopUpFormProps {
	defaultEmail?: string | null;
	initialBalance?: number;
}

interface PendingPayment {
	orderId: string;
	orderNo?: string;
	displayAmount?: string;
	qrCode?: string;
	qrImage?: string;
	payUrl?: string;
	paymentMethod: "alipay" | "wxpay";
	expiresAt?: string;
}

export function TopUpForm({ defaultEmail, initialBalance = 0 }: TopUpFormProps) {
	const [email, setEmail] = useState(defaultEmail ?? "");
	const [amount, setAmount] = useState("1");
	const [paymentMethod, setPaymentMethod] = useState<"alipay" | "wxpay">("alipay");
	const [balance, setBalance] = useState(initialBalance);
	const [isSubmitting, startSubmitTransition] = useTransition();
	const pollingRef = useRef<number | null>(null);
	const [paymentModal, setPaymentModal] = useState<PendingPayment | null>(null);
	const { toast } = useToast();
	const cardT = useTranslations("checkout.card");
	const formT = useTranslations("checkout.form");
	const toastT = useTranslations("checkout.toast");
	const paymentT = useTranslations("checkout.payment");

	const isEmailEditable = !defaultEmail;

	const helperText = useMemo(() => {
		return isEmailEditable
			? formT("emailHelperEditable")
			: formT("emailHelperFixed");
	}, [isEmailEditable, formT]);

	const formattedAmount = useMemo(
		() => Number(amount || 0).toFixed(2),
		[amount],
	);

	const clearPolling = useCallback(() => {
		if (pollingRef.current) {
			window.clearInterval(pollingRef.current);
			pollingRef.current = null;
		}
	}, []);

	const closeModal = useCallback(() => {
		clearPolling();
		setPaymentModal(null);
	}, [clearPolling]);

	const startPolling = useCallback(
		(orderId: string) => {
			clearPolling();
			const poll = async () => {
				const statusResult = await getPaymentOrderStatusAction(orderId);
				if (!statusResult.success || !statusResult.status) {
					toast({
						title: toastT("errorTitle"),
						description:
							statusResult.message ?? toastT("errorDescription"),
						variant: "destructive",
					});
					closeModal();
					return;
				}

				if (statusResult.status === "paid") {
					if (typeof statusResult.balance === "number") {
						setBalance(statusResult.balance);
					}
					toast({
						title: toastT("successTitle"),
						description: toastT("successDescription", {
							balance:
								typeof statusResult.balance === "number"
									? statusResult.balance.toFixed(2)
									: "0.00",
						}),
					});
					closeModal();
					return;
				}

				if (statusResult.status === "expired") {
					toast({
						title: toastT("expiredTitle"),
						description: toastT("expiredDescription"),
						variant: "destructive",
					});
					closeModal();
					return;
				}

				if (statusResult.status === "failed") {
					toast({
						title: toastT("failedTitle"),
						description: toastT("failedDescription"),
						variant: "destructive",
					});
					closeModal();
					return;
				}
			};

			void poll();
			pollingRef.current = window.setInterval(poll, 3000);
		},
		[clearPolling, closeModal, toast, toastT],
	);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isSubmitting) return;

		startSubmitTransition(() => {
			void (async () => {
				const result = await topUpBalanceAction(
					amount,
					isEmailEditable ? email : undefined,
					paymentMethod,
				);

				if (!result.success || !result.orderId) {
					toast({
						title: toastT("errorTitle"),
						description:
							result.message ?? toastT("errorDescription"),
						variant: "destructive",
					});
					return;
				}

				if (result.email && isEmailEditable) {
					setEmail(result.email);
				}

				const qrImage =
					result.qrImage ??
					(result.qrCode
						? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(result.qrCode)}`
						: undefined);

				setPaymentModal({
					orderId: result.orderId,
					orderNo: result.orderNo,
					displayAmount: result.displayAmount,
					qrCode: result.qrCode,
					qrImage,
					payUrl: result.payUrl,
					paymentMethod: result.paymentMethod ?? paymentMethod,
					expiresAt: result.expiresAt,
				});

				toast({
					title: toastT("createdTitle"),
					description: toastT("createdDescription"),
				});

				startPolling(result.orderId);
			})();
		});
	};

	useEffect(() => clearPolling, [clearPolling]);

	return (
		<>
			<div className="space-y-6">
				<div className="space-y-2 rounded-lg border border-primary/10 bg-primary/5 p-4 text-primary-foreground">
					<h3 className="text-lg font-semibold text-primary">
						{cardT("title")}
					</h3>
					<p className="text-sm text-muted-foreground">
						{cardT("description")}
					</p>
					<p className="text-sm font-medium text-primary">
						{cardT("currentBalance", { balance: balance.toFixed(2) })}
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="topup-email">
							{formT("emailLabel")}
							{isEmailEditable ? <span className="text-destructive">*</span> : null}
						</Label>
						<Input
							id="topup-email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							disabled={!isEmailEditable || isSubmitting}
							required={isEmailEditable}
							placeholder="your@email.com"
						/>
						<p className="text-xs text-muted-foreground">{helperText}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="topup-amount">{formT("amountLabel")}</Label>
						<Input
							id="topup-amount"
							type="number"
							step="0.01"
							min="0.01"
							value={amount}
							onChange={(event) => setAmount(event.target.value)}
							disabled={isSubmitting}
							required
						/>
						<p className="text-xs text-muted-foreground">
							{formT("amountHelper", { amount: formattedAmount })}
						</p>
					</div>

					<div className="space-y-2">
						<Label>{formT("paymentMethodLabel")}</Label>
						<RadioGroup
							value={paymentMethod}
							onValueChange={(value) => {
								if (value === "alipay" || value === "wxpay") {
									setPaymentMethod(value);
								}
							}}
							className="grid gap-2 sm:grid-cols-2"
						>
							<div className="flex items-center gap-2 rounded-lg border border-border/60 p-3">
								<RadioGroupItem value="alipay" id="payment-alipay" />
								<Label htmlFor="payment-alipay" className="cursor-pointer">
									{formT("paymentMethodAlipay")}
								</Label>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-border/60 p-3">
								<RadioGroupItem value="wxpay" id="payment-wxpay" />
								<Label htmlFor="payment-wxpay" className="cursor-pointer">
									{formT("paymentMethodWxpay")}
								</Label>
							</div>
						</RadioGroup>
						<p className="text-xs text-muted-foreground">
							{formT("paymentMethodHint")}
						</p>
					</div>

					<Button type="submit" className="w-full" disabled={isSubmitting}>
						{isSubmitting
							? formT("submitPending")
							: formT("submit", { amount: formattedAmount })}
					</Button>
				</form>
			</div>

			<Dialog open={paymentModal != null} onOpenChange={(open) => (open ? undefined : closeModal())}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{paymentT("title")}</DialogTitle>
						<DialogDescription>{paymentT("description")}</DialogDescription>
					</DialogHeader>
					{paymentModal ? (
						<div className="space-y-4">
							<div className="flex flex-col items-center gap-3">
								{paymentModal.qrImage ? (
									<img
										src={paymentModal.qrImage}
										alt={paymentT("title")}
										className="h-64 w-64 rounded-lg border border-border object-contain"
									/>
					) : (
						<div className="flex h-64 w-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted text-sm text-muted-foreground">
							{paymentT("statusSyncing")}
						</div>
					)}
					<div className="text-center text-sm text-muted-foreground">
						{paymentT(
							paymentModal.paymentMethod === "wxpay"
								? "instructionsWxpay"
								: "instructionsAlipay",
						)}
					</div>
					<p className="text-center text-xs text-muted-foreground">
						{paymentT("instructionsGeneric")}
					</p>
				</div>
							<div className="grid gap-2 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">{paymentT("amount")}</span>
									<span className="font-semibold text-primary">
										¥{paymentModal.displayAmount ?? formattedAmount}
									</span>
								</div>
								{paymentModal.orderNo ? (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">{paymentT("orderNo")}</span>
										<span className="font-medium">{paymentModal.orderNo}</span>
									</div>
								) : null}
								{paymentModal.expiresAt ? (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">{paymentT("expiresAt")}</span>
										<span className="font-medium">
											{new Date(paymentModal.expiresAt).toLocaleString()}
										</span>
									</div>
								) : null}
							</div>
						</div>
					) : null}
					<DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-muted-foreground">
							{paymentT("statusPending")}
						</p>
						<div className="flex flex-col gap-2 sm:flex-row">
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									if (!paymentModal?.payUrl) return;
									window.open(paymentModal.payUrl, "_blank", "noopener");
								}}
								disabled={!paymentModal?.payUrl}
							>
								{paymentModal?.paymentMethod === "wxpay"
									? paymentT("openLinkWxpay")
									: paymentModal?.paymentMethod === "alipay"
										? paymentT("openLinkAlipay")
										: paymentT("openLinkFallback")}
							</Button>
							<Button type="button" variant="ghost" onClick={closeModal}>
								{paymentT("close")}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
