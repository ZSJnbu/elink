import { md5 } from "js-md5";
import { env } from "@/env";
import { BaseService } from "../base/base.service";
import type { PaymentOrder } from "@/server/billing/orders";

export interface ZPayQrResponse {
	code: number;
	msg: string;
	trade_no?: string;
	O_id?: string;
	qrcode?: string;
	img?: string;
	payurl?: string;
	type?: "alipay" | "wxpay" | string;
	[key: string]: unknown;
}

export interface ZPayQueryResponse {
	code: number;
	msg?: string;
	trade_no?: string;
	out_trade_no?: string;
	type?: string;
	status?: number | string;
	money?: string;
	[key: string]: unknown;
}

type KeyRecord = Record<string, string>;

function normalizeAmount(amount: number): string {
	return amount.toFixed(2);
}

class ZPayService extends BaseService {
	protected readonly serviceName = "ZPayService";

	public isConfigured(): boolean {
		return Boolean(env.ZPAY_PID && env.ZPAY_KEY);
	}

	private getNotifyUrl(): string {
		return `${env.NEXTAUTH_URL.replace(/\/$/, "")}/api/payments/zpay/notify`;
	}

	private getReturnUrl(orderId: string): string {
		return `${env.NEXTAUTH_URL.replace(/\/$/, "")}/checkout?orderId=${encodeURIComponent(orderId)}`;
	}

	private buildSignature(params: KeyRecord): string {
		const sorted = Object.keys(params)
			.sort()
			.filter((key) => key !== "sign" && key !== "sign_type" && params[key] !== "");

		const signSource = sorted.map((key) => `${key}=${params[key]}`).join("&");
		return md5(signSource + env.ZPAY_KEY!).toLowerCase();
	}

	public verifySignature(payload: KeyRecord): boolean {
		if (!this.isConfigured()) return false;
		const receivedSign = payload.sign;
		if (!receivedSign) return false;

		const calculated = this.buildSignature(payload);
		return receivedSign.toLowerCase() === calculated;
	}

	public async createQrPayment(
		order: PaymentOrder,
		options: {
			paymentMethod: "alipay" | "wxpay";
			description?: string;
		},
	): Promise<ZPayQrResponse> {
		if (!this.isConfigured()) {
			throw new Error("未配置 7Pay 支付参数");
		}

		const params: KeyRecord = {
			pid: env.ZPAY_PID!,
			type: options.paymentMethod,
			out_trade_no: order.orderNo,
			notify_url: this.getNotifyUrl(),
			return_url: this.getReturnUrl(order.id),
			name: options.description ?? "Balance Top-up",
			money: normalizeAmount(order.amount),
			clientip: "",
			device: "pc",
			param: order.id,
			sign_type: "MD5",
		};

		if (env.C_ID) {
			params.cid = env.C_ID;
		}

		const sign = this.buildSignature(params);
		const form = new FormData();
		for (const [key, value] of Object.entries(params)) {
			form.append(key, value);
		}
		form.append("sign", sign);

		this.log("info", "向 7Pay 发起二维码支付请求", {
			orderId: order.id,
			orderNo: order.orderNo,
			paymentMethod: options.paymentMethod,
			amount: params.money,
		});

		const response = await fetch("https://zpayz.cn/mapi.php", {
			method: "POST",
			body: form,
		});

		if (!response.ok) {
			this.log("error", "7Pay mapi.php 非 200 响应", {
				orderId: order.id,
				orderNo: order.orderNo,
				status: response.status,
				statusText: response.statusText,
			});
			throw new Error(`7Pay 请求失败：${response.status} ${response.statusText}`);
		}

		const result = (await response.json()) as ZPayQrResponse;

		this.log("info", "7Pay 返回二维码支付结果", {
			orderId: order.id,
			orderNo: order.orderNo,
			code: result.code,
			msg: result.msg,
			tradeNo: result.trade_no,
		});

		if (result.code !== 1) {
			this.log("warn", "创建 7Pay 订单失败", result);
			throw new Error(result.msg || "创建支付订单失败，请稍后重试");
		}

		return result;
	}

	public async queryOrder(orderNo: string): Promise<ZPayQueryResponse> {
		if (!this.isConfigured()) {
			throw new Error("未配置 7Pay 支付参数");
		}

		const query = new URL("https://zpayz.cn/api.php");
		query.searchParams.set("act", "order");
		query.searchParams.set("pid", env.ZPAY_PID!);
		query.searchParams.set("key", env.ZPAY_KEY!);
		query.searchParams.set("out_trade_no", orderNo);

		const response = await fetch(query.toString(), {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`查询 7Pay 订单失败：${response.status} ${response.statusText}`);
		}

		const result = (await response.json()) as ZPayQueryResponse;
		return result;
	}
}

export const zpayService = new ZPayService();
