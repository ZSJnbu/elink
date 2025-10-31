import { redis } from "@/server/kv";
import { adjustBalance } from "./store";
import { ensureAccessKeyForEmail } from "@/server/api-keys/store";

const PAYMENT_ORDERS_STORAGE_KEY = "app:zpay-payment-orders";

export type PaymentOrderStatus =
	| "pending"
	| "paid"
	| "failed"
	| "expired";

export interface PaymentOrder {
	id: string;
	orderNo: string;
	email: string;
	amount: number;
	displayAmount: string;
	currency: string;
	channel: "zpay";
	paymentMethod: "alipay" | "wxpay";
	status: PaymentOrderStatus;
	createdAt: string;
	updatedAt: string;
	expiresAt?: string;
	paidAt?: string;
	providerTradeNo?: string;
	qrCode?: string;
	qrImage?: string;
	payUrl?: string;
	mapiPayload?: Record<string, unknown>;
	notifyPayload?: Record<string, unknown>;
	lastSyncedAt?: string;
	syncAttempts?: number;
	balanceAfterPayment?: number;
}

type StoredPaymentOrder = PaymentOrder;

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function normalizeAmount(value: number): number {
	return Math.round(value * 100) / 100;
}

function toDisplayAmount(value: number): string {
	return normalizeAmount(value).toFixed(2);
}

async function readPaymentOrders(): Promise<StoredPaymentOrder[]> {
	const rawValue = await redis.get(PAYMENT_ORDERS_STORAGE_KEY);
	if (!rawValue) {
		return [];
	}

	try {
		const json =
			typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		const records = json as Array<Partial<StoredPaymentOrder>>;
		if (!Array.isArray(records)) {
			return [];
		}

		return records
			.filter((record): record is StoredPaymentOrder => {
				if (!record) return false;
				return (
					typeof record.id === "string" &&
					typeof record.orderNo === "string" &&
					typeof record.email === "string" &&
					typeof record.amount === "number" &&
					typeof record.displayAmount === "string" &&
					typeof record.currency === "string" &&
					typeof record.status === "string" &&
					typeof record.createdAt === "string" &&
					typeof record.updatedAt === "string"
				);
			})
			.map((record) => ({
				...record,
				email: normalizeEmail(record.email),
				amount: normalizeAmount(record.amount),
				displayAmount: record.displayAmount ?? toDisplayAmount(record.amount),
				channel: "zpay",
				paymentMethod:
					record.paymentMethod === "wxpay" ? "wxpay" : "alipay",
				status: (record.status as PaymentOrderStatus) ?? "pending",
			}));
	} catch {
		return [];
	}
}

async function writePaymentOrders(records: StoredPaymentOrder[]): Promise<void> {
	await redis.set(PAYMENT_ORDERS_STORAGE_KEY, JSON.stringify(records));
}

function generateOrderNo(): string {
	return `ZP${Date.now()}${Math.floor(Math.random() * 1_000_000)
		.toString()
		.padStart(6, "0")}`;
}

export async function createPaymentOrder(params: {
	email: string;
	amount: number;
	currency?: string;
	paymentMethod?: "alipay" | "wxpay";
	expiresInMinutes?: number;
}): Promise<PaymentOrder> {
	const email = normalizeEmail(params.email);
	if (!email) {
		throw new Error("邮箱不能为空");
	}

	const amount = normalizeAmount(Number(params.amount));
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error("充值金额必须大于 0");
	}

	const now = new Date();
	const expiresAt = params.expiresInMinutes
		? new Date(now.getTime() + params.expiresInMinutes * 60 * 1000)
		: undefined;

	const order: PaymentOrder = {
		id: crypto.randomUUID(),
		orderNo: generateOrderNo(),
		email,
		amount,
		displayAmount: toDisplayAmount(amount),
		currency: params.currency ?? "CNY",
		channel: "zpay",
		paymentMethod: params.paymentMethod ?? "alipay",
		status: "pending",
		createdAt: now.toISOString(),
		updatedAt: now.toISOString(),
		expiresAt: expiresAt?.toISOString(),
	};

	const records = await readPaymentOrders();
	await writePaymentOrders([...records, order]);

	return order;
}

export async function findPaymentOrderById(
	orderId: string,
): Promise<PaymentOrder | null> {
	if (!orderId) return null;
	const records = await readPaymentOrders();
	return records.find((record) => record.id === orderId) ?? null;
}

export async function findPaymentOrderByOrderNo(
	orderNo: string,
): Promise<PaymentOrder | null> {
	if (!orderNo) return null;
	const records = await readPaymentOrders();
	return records.find((record) => record.orderNo === orderNo) ?? null;
}

export async function updatePaymentOrder(
	orderId: string,
	patch: Partial<PaymentOrder>,
): Promise<PaymentOrder | null> {
	const records = await readPaymentOrders();
	const index = records.findIndex((record) => record.id === orderId);

	if (index < 0) {
		return null;
	}

	const now = new Date().toISOString();
	const updated: PaymentOrder = {
		...records[index]!,
		...patch,
		updatedAt: now,
	};

	const next = [...records];
	next[index] = updated;
	await writePaymentOrders(next);

	return updated;
}

export async function markPaymentOrderPaid(params: {
	orderId: string;
	providerTradeNo?: string;
	notifyPayload?: Record<string, unknown>;
	operator?: string;
}): Promise<PaymentOrder | null> {
	const records = await readPaymentOrders();
	const index = records.findIndex((record) => record.id === params.orderId);

	if (index < 0) {
		return null;
	}

	const existing = records[index]!;
	if (existing.status === "paid") {
		return existing;
	}

	const balanceRecord = await adjustBalance({
		email: existing.email,
		amount: existing.amount,
		updatedBy: params.operator ?? `zpay:${params.providerTradeNo ?? existing.orderNo}`,
	});

	await ensureAccessKeyForEmail({
		email: existing.email,
		createdBy: params.operator ?? `zpay:${params.providerTradeNo ?? existing.orderNo}`,
	});

	const now = new Date().toISOString();
	const updated: PaymentOrder = {
		...existing,
		status: "paid",
		providerTradeNo: params.providerTradeNo ?? existing.providerTradeNo,
		notifyPayload: params.notifyPayload ?? existing.notifyPayload,
		paidAt: now,
		updatedAt: now,
		balanceAfterPayment: balanceRecord.balance,
	};

	const next = [...records];
	next[index] = updated;
	await writePaymentOrders(next);

	return updated;
}

export async function expirePaymentOrder(orderId: string): Promise<PaymentOrder | null> {
	return updatePaymentOrder(orderId, { status: "expired" });
}
