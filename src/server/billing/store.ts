import { redis } from "@/server/kv";

const BALANCE_STORAGE_KEY = "app:user-balances";
const USAGE_STORAGE_KEY = "app:user-usage";

export interface BalanceRecord {
	email: string;
	balance: number;
	updatedAt: string;
	updatedBy: string;
}

export interface UsageSummary {
	email: string;
	totalTokens: number;
	totalSpent: number;
	lastUsedAt: string;
}

type StoredBalanceRecord = BalanceRecord;
type StoredUsageRecord = UsageSummary;

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function normalizeAmount(value: number): number {
	return Math.round(value * 100) / 100;
}

async function readBalanceRecords(): Promise<StoredBalanceRecord[]> {
	const rawValue = await redis.get(BALANCE_STORAGE_KEY);
	if (!rawValue) {
		return [];
	}

	try {
		const json =
			typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		const records = json as Array<Partial<StoredBalanceRecord>>;
		if (!Array.isArray(records)) {
			return [];
		}

		return records
			.filter(
				(record): record is StoredBalanceRecord =>
					!!record &&
					typeof record.email === "string" &&
					typeof record.balance === "number" &&
					typeof record.updatedAt === "string" &&
					typeof record.updatedBy === "string",
			)
			.map((record) => ({
				email: normalizeEmail(record.email),
				balance: normalizeAmount(record.balance),
				updatedAt: record.updatedAt,
				updatedBy: record.updatedBy,
			}));
	} catch {
		return [];
	}
}

async function writeBalanceRecords(records: StoredBalanceRecord[]): Promise<void> {
	await redis.set(BALANCE_STORAGE_KEY, JSON.stringify(records));
}

async function readUsageRecords(): Promise<StoredUsageRecord[]> {
	const rawValue = await redis.get(USAGE_STORAGE_KEY);
	if (!rawValue) {
		return [];
	}

	try {
		const json =
			typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		const records = json as Array<Partial<StoredUsageRecord>>;
		if (!Array.isArray(records)) {
			return [];
		}

		return records
			.filter(
				(record): record is StoredUsageRecord =>
					!!record &&
					typeof record.email === "string" &&
					typeof record.totalTokens === "number" &&
					typeof record.totalSpent === "number" &&
					typeof record.lastUsedAt === "string",
			)
			.map((record) => ({
				email: normalizeEmail(record.email),
				totalTokens: record.totalTokens,
				totalSpent: normalizeAmount(record.totalSpent),
				lastUsedAt: record.lastUsedAt,
			}));
	} catch {
		return [];
	}
}

async function writeUsageRecords(records: StoredUsageRecord[]): Promise<void> {
	await redis.set(USAGE_STORAGE_KEY, JSON.stringify(records));
}

export async function getBalance(email: string): Promise<number> {
	const normalizedEmail = normalizeEmail(email);
	const records = await readBalanceRecords();
	const record = records.find((item) => item.email === normalizedEmail);
	return record?.balance ?? 0;
}

export async function listBalances(): Promise<BalanceRecord[]> {
	const records = await readBalanceRecords();
	return records.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

export async function adjustBalance(params: {
	email: string;
	amount: number;
	updatedBy: string;
}): Promise<BalanceRecord> {
	const normalizedEmail = normalizeEmail(params.email);
	const amount = normalizeAmount(Number(params.amount));

	if (!normalizedEmail) {
		throw new Error("邮箱不能为空");
	}

	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error("充值金额必须大于 0");
	}

	const records = await readBalanceRecords();
	const existingIndex = records.findIndex(
		(record) => record.email === normalizedEmail,
	);

	const now = new Date().toISOString();
	const updatedRecord: BalanceRecord =
		existingIndex >= 0
			? {
				...records[existingIndex]!,
				balance: normalizeAmount(records[existingIndex]!.balance + amount),
				updatedAt: now,
				updatedBy: params.updatedBy,
			}
			: {
				email: normalizedEmail,
				balance: normalizeAmount(amount),
				updatedAt: now,
				updatedBy: params.updatedBy,
			};

	if (existingIndex >= 0) {
		const next = [...records];
		next[existingIndex] = updatedRecord;
		await writeBalanceRecords(next);
	} else {
		await writeBalanceRecords([...records, updatedRecord]);
	}

	return updatedRecord;
}

export async function deductBalance(params: {
	email: string;
	amount: number;
	updatedBy: string;
}): Promise<BalanceRecord> {
	const normalizedEmail = normalizeEmail(params.email);
	const amount = normalizeAmount(Number(params.amount));

	if (!normalizedEmail) {
		throw new Error("邮箱不能为空");
	}

	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error("扣费金额必须大于 0");
	}

	const records = await readBalanceRecords();
	const existingIndex = records.findIndex(
		(record) => record.email === normalizedEmail,
	);

	if (existingIndex < 0) {
		throw new Error("余额不足，请先充值");
	}

	const current = records[existingIndex]!;
	if (current.balance < amount) {
		throw new Error("余额不足，请先充值");
	}

	const now = new Date().toISOString();
	const updatedRecord: BalanceRecord = {
		...current,
		balance: normalizeAmount(current.balance - amount),
		updatedAt: now,
		updatedBy: params.updatedBy,
	};

	const next = [...records];
	next[existingIndex] = updatedRecord;
	await writeBalanceRecords(next);

	return updatedRecord;
}

export async function addUsageRecord(params: {
	email: string;
	tokens: number;
	cost: number;
}): Promise<UsageSummary> {
	const normalizedEmail = normalizeEmail(params.email);
	const tokens = Number(params.tokens);
	const cost = normalizeAmount(Number(params.cost));

	if (!normalizedEmail) {
		throw new Error("邮箱不能为空");
	}

	if (!Number.isFinite(tokens) || tokens < 0) {
		throw new Error("Token 数量无效");
	}

	const records = await readUsageRecords();
	const existingIndex = records.findIndex(
		(record) => record.email === normalizedEmail,
	);

	const now = new Date().toISOString();
	const updated: UsageSummary =
		existingIndex >= 0
			? {
				...records[existingIndex]!,
				totalTokens: records[existingIndex]!.totalTokens + tokens,
				totalSpent: normalizeAmount(records[existingIndex]!.totalSpent + cost),
				lastUsedAt: now,
			}
			: {
				email: normalizedEmail,
				totalTokens: tokens,
				totalSpent: normalizeAmount(cost),
				lastUsedAt: now,
			};

	if (existingIndex >= 0) {
		const next = [...records];
		next[existingIndex] = updated;
		await writeUsageRecords(next);
	} else {
		await writeUsageRecords([...records, updated]);
	}

	return updated;
}
