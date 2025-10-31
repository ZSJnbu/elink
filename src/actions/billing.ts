'use server';

import { auth } from "@/auth";
import { getBalance, deductBalance, addUsageRecord } from "@/server/billing/store";
import { getTokenPricing } from "@/server/billing/pricing";
import {
	createPaymentOrder,
	findPaymentOrderById,
	markPaymentOrderPaid,
	updatePaymentOrder,
	type PaymentOrderStatus,
} from "@/server/billing/orders";
import { zpayService } from "@/services/payment/zpay.service";

interface TopUpResult {
	success: boolean;
	email?: string;
	message?: string;
	orderId?: string;
	orderNo?: string;
	displayAmount?: string;
	qrCode?: string;
	qrImage?: string;
	payUrl?: string;
	paymentMethod?: "alipay" | "wxpay";
	expiresAt?: string;
}

export async function topUpBalanceAction(
	amountInput: string,
	emailInput?: string,
	paymentMethodInput?: string,
): Promise<TopUpResult> {
	const session = await auth();
	const hasSessionEmail = !!session?.user?.email;
	const email = hasSessionEmail
		? session!.user!.email!
		: (emailInput ?? "").trim().toLowerCase();

	if (!email) {
		return {
			success: false,
			message: "请填写有效的邮箱地址",
		};
	}

	const amount = Number.parseFloat(amountInput);
	if (!Number.isFinite(amount) || amount <= 0) {
		return {
			success: false,
			message: "请输入大于 0 的充值金额",
		};
	}

	if (!zpayService.isConfigured()) {
		return {
			success: false,
			message: "支付渠道暂未配置，请联系管理员后重试。",
		};
	}

	const paymentMethod =
		paymentMethodInput === "wxpay" ? "wxpay" : (paymentMethodInput === "alipay" ? "alipay" : "alipay");

	const order = await createPaymentOrder({
		email,
		amount,
		currency: "CNY",
		paymentMethod,
		expiresInMinutes: 30,
	});

	try {
		const qrResult = await zpayService.createQrPayment(order, {
			paymentMethod,
			description: `Balance top-up ${order.displayAmount}`,
		});

		const updated = await updatePaymentOrder(order.id, {
			providerTradeNo:
				typeof qrResult.trade_no === "string" ? qrResult.trade_no : undefined,
			qrCode:
				typeof qrResult.qrcode === "string" ? qrResult.qrcode : undefined,
			qrImage:
				typeof qrResult.img === "string" ? qrResult.img : undefined,
			payUrl:
				typeof qrResult.payurl === "string"
					? qrResult.payurl
					: typeof qrResult.qrcode === "string"
						? qrResult.qrcode
						: undefined,
			mapiPayload: qrResult,
			paymentMethod,
		});

		return {
			success: true,
			email: updated?.email ?? order.email,
			orderId: order.id,
			orderNo: order.orderNo,
			displayAmount: order.displayAmount,
			qrCode: updated?.qrCode ?? order.qrCode,
			qrImage: updated?.qrImage ?? order.qrImage,
			payUrl: updated?.payUrl ?? order.payUrl,
			paymentMethod,
			expiresAt: order.expiresAt,
		};
	} catch (error) {
		await updatePaymentOrder(order.id, { status: "failed" });
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "创建支付订单失败，请稍后重试",
		};
	}
}

export async function chargeUsageForTokens(email: string, tokens: number) {
	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail) {
		throw new Error("邮箱不能为空");
	}

	const tokensUsed = Number(tokens);
	if (!Number.isFinite(tokensUsed) || tokensUsed < 0) {
		throw new Error("Token 数量无效");
	}

	const { pricePerThousandTokens } = await getTokenPricing();
	const rawCost = (pricePerThousandTokens * tokensUsed) / 1000;
	const cost = Math.round(rawCost * 100) / 100;
	if (cost <= 0) {
		return {
			email: normalizedEmail,
			cost: 0,
			balance: await getBalance(normalizedEmail),
		};
	}

	const updated = await deductBalance({
		email: normalizedEmail,
		amount: cost,
		updatedBy: normalizedEmail,
	});

	await addUsageRecord({
		email: normalizedEmail,
		tokens: tokensUsed,
		cost,
	});

	return {
		email: normalizedEmail,
		cost,
		balance: updated.balance,
	};
}

export async function getBalanceForEmail(email?: string | null): Promise<number> {
	if (!email) {
		return 0;
	}
	return getBalance(email);
}

interface PaymentStatusResult {
	success: boolean;
	status?: PaymentOrderStatus;
	balance?: number;
	email?: string;
	orderId?: string;
	orderNo?: string;
	displayAmount?: string;
	message?: string;
}

export async function getPaymentOrderStatusAction(
	orderId: string,
): Promise<PaymentStatusResult> {
	const normalizedOrderId = orderId.trim();
	if (!normalizedOrderId) {
		return {
			success: false,
			message: "订单号无效",
		};
	}

	const session = await auth();
	const order = await findPaymentOrderById(normalizedOrderId);

	if (!order) {
		return {
			success: false,
			message: "未找到对应的支付订单",
		};
	}

	if (session?.user?.email && session.user.email !== order.email) {
		return {
			success: false,
			message: "无权查看该订单的状态",
		};
	}

	let current = order;
	const now = new Date();

	if (order.status === "pending") {
		if (order.expiresAt && new Date(order.expiresAt) < now) {
			current =
				(await updatePaymentOrder(order.id, { status: "expired" })) ?? order;
		} else if (zpayService.isConfigured()) {
			const lastSync = order.lastSyncedAt ? new Date(order.lastSyncedAt) : null;
			const elapsed = lastSync ? now.getTime() - lastSync.getTime() : Infinity;
			const shouldSync = elapsed > 10_000;

			if (shouldSync) {
				try {
					const query = await zpayService.queryOrder(order.orderNo);
					console.log("[ZPAY] query result", {
						orderId: order.id,
						orderNo: order.orderNo,
						raw: query,
					});
					await updatePaymentOrder(order.id, {
						lastSyncedAt: now.toISOString(),
						syncAttempts: (order.syncAttempts ?? 0) + 1,
						mapiPayload: query,
					});

					const codeValue = query?.code;
					const codeOk =
						codeValue === 1 ||
						codeValue === "1" ||
						(typeof codeValue === "string" &&
							codeValue.trim().toUpperCase() === "SUCCESS");

					const rawStatus =
						query?.status ??
						query?.trade_status ??
						(query as { trade_state?: unknown })?.trade_state ??
						(query as { state?: unknown })?.state ??
						(query as { order_status?: unknown })?.order_status ??
						(query as { pay_status?: unknown })?.pay_status;

					const normalizedStatus =
						typeof rawStatus === "string"
							? rawStatus.trim()
							: rawStatus != null
								? String(rawStatus).trim()
								: "";
					const normalizedUpper = normalizedStatus.toUpperCase();
					const statusOk =
						normalizedStatus === "1" ||
						normalizedUpper === "1" ||
						normalizedUpper === "PAID" ||
						normalizedUpper === "SUCCESS" ||
						normalizedUpper === "SUCCEED" ||
						normalizedUpper === "TRADE_SUCCESS" ||
						normalizedUpper === "FINISHED" ||
						normalizedUpper === "COMPLETED" ||
						normalizedUpper === "OK" ||
						normalizedUpper === "PAY_SUCCESS" ||
						normalizedStatus.includes("支付");

					if (codeOk && statusOk) {
						current =
							(await markPaymentOrderPaid({
								orderId: order.id,
								providerTradeNo:
									typeof query.trade_no === "string"
										? query.trade_no
										: undefined,
								notifyPayload: query,
								operator: "zpay:sync",
							})) ?? order;
					} else {
						current = (await findPaymentOrderById(order.id)) ?? order;
					}
				} catch (error) {
					await updatePaymentOrder(order.id, {
						lastSyncedAt: now.toISOString(),
						syncAttempts: (order.syncAttempts ?? 0) + 1,
					});
					console.error("同步 7Pay 订单失败", error);
					current = (await findPaymentOrderById(order.id)) ?? order;
				}
			}
		}
	}

	const balance =
		current.status === "paid" ? await getBalance(current.email) : undefined;

	return {
		success: true,
		status: current.status,
		balance,
		email: current.email,
		orderId: current.id,
		orderNo: current.orderNo,
		displayAmount: current.displayAmount,
	};
}
