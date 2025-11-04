import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { md5 } from "js-md5";
import { redis } from "@/server/kv";

const STORAGE_KEY = "app:api-access-keys";

export interface AccessKeyRecord {
	id: string;
	email: string;
	hash: string;
	createdAt: string;
	createdBy: string;
}

interface StoredRecord extends AccessKeyRecord {}

async function readRecords(): Promise<StoredRecord[]> {
	const rawValue = await redis.get(STORAGE_KEY);
	if (!rawValue) {
		return [];
	}

	try {
		const recordsRaw =
			typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
		const records = recordsRaw as Array<Partial<StoredRecord>>;
		if (!Array.isArray(records)) {
			return [];
		}
		return records
			.filter((record): record is StoredRecord => {
				if (!record || typeof record !== "object") {
					return false;
				}
				return (
					typeof record.id === "string" &&
					typeof record.email === "string" &&
					typeof record.hash === "string" &&
					typeof record.createdAt === "string" &&
					typeof record.createdBy === "string"
				);
			})
			.map((record) => ({
				id: record.id,
				email: record.email.trim().toLowerCase(),
				hash: record.hash,
				createdAt: record.createdAt,
				createdBy: record.createdBy,
			}));
	} catch {
		return [];
	}
}

async function writeRecords(records: StoredRecord[]): Promise<void> {
	await redis.set(STORAGE_KEY, JSON.stringify(records));
}

function normalizeEmail(raw: string) {
	return raw.trim().toLowerCase();
}

function deriveAccessKey(email: string) {
	const encoder = new TextEncoder();
	return bytesToHex(sha256(encoder.encode(email)));
}

function deriveAccessToken(email: string) {
	const normalizedEmail = normalizeEmail(email);
	const encoder = new TextEncoder();
	const md5Digest = md5(normalizedEmail);
	return bytesToHex(sha256(encoder.encode(md5Digest)));
}

function hashAccessKey(accessKey: string) {
	const encoder = new TextEncoder();
	return bytesToHex(
		sha256(encoder.encode(`access-key:${accessKey}`)),
	);
}

export async function listAccessKeys(): Promise<AccessKeyRecord[]> {
	return readRecords();
}

export async function addAccessKey(params: {
	email: string;
	createdBy: string;
}): Promise<{ record: AccessKeyRecord; accessKey: string }> {
	const email = normalizeEmail(params.email);
	if (!email) {
		throw new Error("邮箱不能为空");
	}

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailPattern.test(email)) {
		throw new Error("请输入有效的邮箱地址");
	}

	const existing = await readRecords();
	const duplicate = existing.some((record) => record.email === email);
	if (duplicate) {
		throw new Error("该邮箱已生成过访问密钥");
	}

	const accessKey = deriveAccessKey(email);
	const hash = hashAccessKey(accessKey);

	const record: AccessKeyRecord = {
		id: crypto.randomUUID(),
		email,
		hash,
		createdAt: new Date().toISOString(),
		createdBy: params.createdBy,
	};

	await writeRecords([...existing, record]);

	return { record, accessKey };
}

export async function removeAccessKey(id: string): Promise<void> {
	const existing = await readRecords();
	const next = existing.filter((record) => record.id !== id);
	await writeRecords(next);
}

export async function getAccessKeyPlain(
	id: string,
): Promise<{ record: AccessKeyRecord; accessKey: string; accessToken: string } | null> {
	const records = await readRecords();
	const record = records.find((item) => item.id === id);
	if (!record) {
		return null;
	}

	const accessKey = deriveAccessKey(record.email);
	const accessToken = deriveAccessToken(record.email);
	return { record, accessKey, accessToken };
}

export async function updateAccessKey(params: {
	id: string;
	email: string;
	updatedBy: string;
}): Promise<{ record: AccessKeyRecord; accessKey: string }> {
	const email = normalizeEmail(params.email);
	if (!email) {
		throw new Error("邮箱不能为空");
	}

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailPattern.test(email)) {
		throw new Error("请输入有效的邮箱地址");
	}

	const records = await readRecords();
	const index = records.findIndex((record) => record.id === params.id);
	if (index === -1) {
		throw new Error("未找到指定的密钥记录");
	}

	const duplicate = records.some(
		(record, idx) => idx !== index && record.email === email,
	);
	if (duplicate) {
		throw new Error("该邮箱已生成过访问密钥");
	}

	const accessKey = deriveAccessKey(email);
	const hash = hashAccessKey(accessKey);

	const target = records[index];
	if (!target) {
		throw new Error("未找到指定的密钥记录");
	}

	const updated: AccessKeyRecord = {
		...target,
		email,
		hash,
		createdAt: target.createdAt,
		createdBy: target.createdBy,
	};

	const nextRecords = [...records];
	nextRecords[index] = updated;
	await writeRecords(nextRecords);

	return { record: updated, accessKey };
}

export async function validateAccessKey(candidate: string): Promise<boolean> {
	const value = candidate.trim();
	if (!value) {
		return false;
	}

	const owner = await findAccessKeyOwner(value);
	return !!owner;
}

export async function getAccessKeyByEmail(email: string): Promise<
	| { record: AccessKeyRecord; accessKey: string; accessToken: string }
	| null
> {
	const normalized = normalizeEmail(email);
	if (!normalized) {
		return null;
	}

	const records = await readRecords();
	const record = records.find((item) => item.email === normalized);
	if (!record) {
		return null;
	}

	return {
		record,
		accessKey: deriveAccessKey(record.email),
		accessToken: deriveAccessToken(record.email),
	};
}

export async function ensureAccessKeyForEmail(params: {
	email: string;
	createdBy: string;
}): Promise<{ record: AccessKeyRecord; accessKey: string }> {
	const existing = await getAccessKeyByEmail(params.email);
	if (existing) {
		return existing;
	}

	return addAccessKey({
		email: params.email,
		createdBy: params.createdBy,
	});
}

export async function findAccessKeyOwner(accessKey: string) {
	const value = accessKey.trim();
	if (!value) {
		return null;
	}

	const hashedCandidate = hashAccessKey(value);
	const records = await readRecords();
	for (let index = 0; index < records.length; index++) {
		const record = records[index]!;

		if (record.hash === hashedCandidate) {
			return record;
		}

		const legacyAccessKey = deriveAccessKey(record.email);
		if (value === legacyAccessKey) {
			if (record.hash !== hashedCandidate) {
				const updated: AccessKeyRecord = {
					...record,
					hash: hashedCandidate,
				};
				const nextRecords = [...records];
				nextRecords[index] = updated;
				await writeRecords(nextRecords);
				return updated;
			}

			return record;
		}
	}

	return null;
}

export function getAccessTokenForEmail(email: string): string {
	return deriveAccessToken(email);
}
