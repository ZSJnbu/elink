'use server';

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
	addAccessKey,
	getAccessKeyPlain,
	removeAccessKey,
	updateAccessKey,
	type AccessKeyRecord,
} from "@/server/api-keys/store";

function sanitizeRecord(record: AccessKeyRecord) {
	return {
		id: record.id,
		email: record.email,
		createdAt: record.createdAt,
		createdBy: record.createdBy,
		hashPreview: record.hash.slice(0, 10),
	};
}

async function ensureAdmin() {
	const session = await auth();
	if (!session?.user?.isAdmin) {
		throw new Error("仅管理员可以执行此操作");
	}
	return session;
}

export async function createAccessKeyAction(input: { email: string }) {
	const session = await ensureAdmin();
	const createdBy = session.user?.email || session.user?.id || "admin";

	const { record, accessKey } = await addAccessKey({
		email: input.email,
		createdBy,
	});

	revalidatePath("/admin");

	return {
		success: true,
		record: sanitizeRecord(record),
		accessKey,
	};
}

export async function deleteAccessKeyAction(id: string) {
	await ensureAdmin();
	await removeAccessKey(id);
	revalidatePath("/admin");
	return { success: true };
}

export async function getAccessKeyPlainAction(id: string) {
	await ensureAdmin();
	const result = await getAccessKeyPlain(id);
	if (!result) {
		throw new Error("未找到密钥记录");
	}

	return {
		success: true,
		record: sanitizeRecord(result.record),
		accessKey: result.accessKey,
	};
}

export async function updateAccessKeyAction(input: { id: string; email: string }) {
	const session = await ensureAdmin();
	const updatedBy = session.user?.email || session.user?.id || "admin";

	const result = await updateAccessKey({
		id: input.id,
		email: input.email,
		updatedBy,
	});

	revalidatePath("/admin");

	return {
		success: true,
		record: sanitizeRecord(result.record),
		accessKey: result.accessKey,
	};
}
