import { NextResponse } from "next/server";
import { zpayService } from "@/services/payment/zpay.service";
import {
	findPaymentOrderByOrderNo,
	markPaymentOrderPaid,
	updatePaymentOrder,
} from "@/server/billing/orders";

type Payload = Record<string, string>;

function formDataToRecord(formData: FormData): Payload {
	const result: Payload = {};
	for (const [key, value] of formData.entries()) {
		if (typeof value === "string") {
			result[key] = value;
		}
	}
	return result;
}

function searchParamsToRecord(searchParams: URLSearchParams): Payload {
	const result: Payload = {};
	for (const [key, value] of searchParams.entries()) {
		result[key] = value;
	}
	return result;
}

async function handleNotification(payload: Payload): Promise<Response> {
	if (!zpayService.isConfigured()) {
		return new Response("success");
	}

	const outTradeNo = payload.out_trade_no;
	if (!outTradeNo) {
		return new Response("success");
	}

	const order = await findPaymentOrderByOrderNo(outTradeNo);
	if (!order) {
		return new Response("success");
	}

	const isSignatureValid = zpayService.verifySignature(payload);
	if (!isSignatureValid) {
		await updatePaymentOrder(order.id, {
			notifyPayload: payload,
		});
		return new Response("success");
	}

	await updatePaymentOrder(order.id, {
		notifyPayload: payload,
	});

	if (order.status === "paid") {
		return new Response("success");
	}

	const money = payload.money;
	if (money) {
		const paidAmount = Number.parseFloat(money);
		const orderAmount = Number.parseFloat(order.displayAmount);
		if (
			Number.isFinite(paidAmount) &&
			Number.isFinite(orderAmount) &&
			Math.abs(paidAmount - orderAmount) > 0.001
		) {
			return new Response("success");
		}
	}

	const tradeStatus = payload.trade_status || payload.status || payload.trade_state;
	if (tradeStatus) {
		const normalizedStatus = tradeStatus.trim();
		const normalizedUpper = normalizedStatus.toUpperCase();
		const statusOk =
			normalizedStatus === "1" ||
			normalizedUpper === "1" ||
			normalizedUpper === "TRADE_SUCCESS" ||
			normalizedUpper === "SUCCESS" ||
			normalizedUpper === "PAID" ||
			normalizedUpper === "SUCCEED" ||
			normalizedUpper === "FINISHED" ||
			normalizedUpper === "COMPLETED" ||
			normalizedUpper === "OK" ||
			normalizedUpper === "PAY_SUCCESS" ||
			normalizedStatus.includes("支付");

		if (!statusOk) {
			return new Response("success");
		}
	}

	await markPaymentOrderPaid({
		orderId: order.id,
		providerTradeNo: payload.trade_no,
		notifyPayload: payload,
		operator: "zpay:notify",
	});

	return new Response("success");
}

export async function POST(request: Request) {
	const formData = await request.formData();
	return handleNotification(formDataToRecord(formData));
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	return handleNotification(searchParamsToRecord(url.searchParams));
}
