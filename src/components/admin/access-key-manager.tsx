"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import {
	createAccessKeyAction,
	deleteAccessKeyAction,
	getAccessKeyPlainAction,
	updateAccessKeyAction,
} from "@/actions/admin/api-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export interface AccessKeyView {
	id: string;
	email: string;
	createdAt: string;
	createdBy: string;
	hashPreview: string;
	accessToken: string;
	balance: number;
}

interface AccessKeyManagerProps {
	keys: AccessKeyView[];
}

export function AccessKeyManager({ keys }: AccessKeyManagerProps) {
	const router = useRouter();
	const { toast } = useToast();
	const t = useTranslations("admin.accessKeys");
	const toastT = useTranslations("admin.accessKeys.toast");

const [isCreateOpen, setCreateOpen] = useState(false);
const [emailValue, setEmailValue] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [isViewOpen, setViewOpen] = useState(false);
const [viewData, setViewData] = useState<{
	email: string;
	accessKey: string;
	accessToken: string;
	balance: number;
} | null>(null);
	const [isEditOpen, setEditOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editEmail, setEditEmail] = useState("");
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const [isCreating, startCreateTransition] = useTransition();
	const [isViewing, startViewTransition] = useTransition();
	const [isEditing, startEditTransition] = useTransition();
	const [isDeleting, startDeleteTransition] = useTransition();

	const sortedKeys = useMemo(
		() =>
			[...keys].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
				),
		[keys],
	);

const filteredKeys = useMemo(() => {
	const term = searchTerm.trim().toLowerCase();
	if (!term) {
		return sortedKeys;
	}

	return sortedKeys.filter((key) =>
		key.email.toLowerCase().includes(term),
	);
}, [searchTerm, sortedKeys]);

	const handleCopyToken = (token: string | undefined) => {
		if (!token) return;
		void navigator.clipboard
			.writeText(token)
			.then(() =>
				toast({
					title: toastT("copyToken.successTitle"),
					description: toastT("copyToken.successDescription"),
				}),
			)
			.catch(() =>
				toast({
					title: toastT("copyToken.errorTitle"),
					description: toastT("copyToken.errorDescription"),
					variant: "destructive",
				}),
			);
	};

	const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!emailValue || isCreating) {
			return;
		}

		startCreateTransition(() => {
			void (async () => {
				try {
					const result = await createAccessKeyAction({
						email: emailValue,
					});

					setEmailValue("");
					setCreateOpen(false);
					router.refresh();

					try {
						await navigator.clipboard.writeText(result.accessKey);
						toast({
							title: toastT("create.successTitle"),
							description: toastT("create.successDescriptionClipboard"),
						});
					} catch {
						toast({
							title: toastT("create.successTitle"),
							description: toastT("create.successDescription"),
						});
					}
				} catch (error) {
					console.error("Create access key failed", error);
					toast({
						title: toastT("create.errorTitle"),
						description:
							error instanceof Error
								? error.message
								: toastT("create.errorDescription"),
						variant: "destructive",
					});
				}
			})();
		});
	};

	const handleDelete = (id: string) => {
		if (isDeleting) return;

		setDeletingId(id);
		startDeleteTransition(() => {
			void (async () => {
				try {
					await deleteAccessKeyAction(id);
					toast({
						title: toastT("delete.successTitle"),
						description: toastT("delete.successDescription"),
					});
					router.refresh();
				} catch (error) {
					console.error("Delete access key failed", error);
					toast({
						title: toastT("delete.errorTitle"),
						description:
							error instanceof Error
								? error.message
								: toastT("delete.errorDescription"),
						variant: "destructive",
					});
				} finally {
					setDeletingId(null);
				}
			})();
		});
	};

const handleView = (item: AccessKeyView) => {
		startViewTransition(() => {
			void (async () => {
				try {
					const result = await getAccessKeyPlainAction(item.id);
					setViewData({
						email: result.record.email,
						accessKey: result.accessKey,
						accessToken: result.accessToken,
						balance: item.balance,
					});
					setViewOpen(true);
				} catch (error) {
					console.error("Fetch access key failed", error);
					toast({
						title: toastT("fetch.errorTitle"),
						description:
							error instanceof Error
								? error.message
								: toastT("fetch.errorDescription"),
						variant: "destructive",
					});
				}
			})();
		});
	};

	const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editingId || !editEmail || isEditing) {
			return;
		}

		startEditTransition(() => {
			void (async () => {
				try {
					const result = await updateAccessKeyAction({
						id: editingId,
						email: editEmail,
					});

					setEditOpen(false);
					setEditingId(null);
					setEditEmail("");
					router.refresh();

					try {
						await navigator.clipboard.writeText(result.accessKey);
						toast({
							title: toastT("update.successTitle"),
							description: toastT("update.successDescriptionClipboard"),
						});
					} catch {
						toast({
							title: toastT("update.successTitle"),
							description: toastT("update.successDescription"),
						});
					}
				} catch (error) {
					console.error("Update access key failed", error);
					toast({
						title: toastT("update.errorTitle"),
						description:
							error instanceof Error
								? error.message
								: toastT("update.errorDescription"),
						variant: "destructive",
					});
				}
			})();
		});
	};

	return (
		<>
			<Card>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-2">
					<CardTitle>{t("title")}</CardTitle>
					<div className="w-full sm:w-64">
						<Input
							placeholder={t("searchPlaceholder")}
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="mr-2 h-4 w-4" />
							{t("addButton")}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("dialog.createTitle")}</DialogTitle>
							<DialogDescription>
								{t("dialog.createDescription")}
							</DialogDescription>
						</DialogHeader>
							<form onSubmit={handleCreate} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="new-key-email">{t("dialog.emailLabel")}</Label>
									<Input
										id="new-key-email"
										type="email"
										placeholder="partner@example.com"
										value={emailValue}
										onChange={(event) =>
											setEmailValue(event.target.value)
										}
										required
										disabled={isCreating}
									/>
								</div>
								<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setCreateOpen(false)}
							disabled={isCreating}
						>
							{t("dialog.cancel")}
						</Button>
						<Button type="submit" disabled={isCreating}>
							{isCreating
								? t("dialog.submitPending")
								: t("dialog.confirm")}
						</Button>
								</DialogFooter>
				<p className="text-xs text-muted-foreground">
					{t("dialog.hint")}
				</p>
							</form>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
				{filteredKeys.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{keys.length === 0
							? t("empty")
							: t("emptyFiltered")}
					</p>
				) : (
					<div className="space-y-4">
						{filteredKeys.map((key) => {
								const isDeletingCurrent =
									isDeleting && deletingId === key.id;
								return (
									<div
										key={key.id}
										className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-start sm:justify-between"
									>
										<div className="space-y-1">
					<p className="text-sm font-medium">
						{t("item.email", { email: key.email })}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("item.hash", { preview: key.hashPreview })}
					</p>
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span className="break-all">
							{t("item.token", { token: key.accessToken })}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleCopyToken(key.accessToken)}
						>
							{t("buttons.copyToken")}
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("item.createdAt", {
							value: new Date(key.createdAt).toLocaleString(),
						})}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("item.createdBy", { value: key.createdBy })}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("item.balance", { value: key.balance.toFixed(2) })}
					</p>
										</div>
										<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							setEditingId(key.id);
							setEditEmail(key.email);
							setEditOpen(true);
						}}
						title={t("buttons.edit")}
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleView(key)}
						title={t("buttons.view")}
						disabled={isViewing}
					>
						<Eye className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleDelete(key.id)}
						disabled={isDeletingCurrent}
						title={t("buttons.delete")}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={isViewOpen}
				onOpenChange={(open) => {
					setViewOpen(open);
					if (!open) {
						setViewData(null);
					}
				}}
			>
				<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("dialog.viewTitle")}</DialogTitle>
					<DialogDescription>{t("dialog.viewDescription")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label>{t("dialog.viewEmail")}</Label>
						<p className="mt-1 rounded-md border bg-muted/50 p-2 text-sm">
							{viewData?.email ?? t("dialog.loading")}
						</p>
					</div>
					<div>
						<Label>{t("dialog.viewBalance")}</Label>
						<p className="mt-1 rounded-md border bg-muted/50 p-2 text-sm">
							{viewData
								? t("dialog.balanceValue", {
									balance: viewData.balance.toFixed(2),
								})
								: t("dialog.loading")}
						</p>
					</div>
					<div>
						<Label>{t("dialog.viewKey")}</Label>
						<p className="mt-1 break-all rounded-md border bg-muted/50 p-2 text-sm">
							{viewData?.accessKey ?? t("dialog.loading")}
						</p>
					</div>
					<div>
						<Label>{t("dialog.viewToken")}</Label>
						<p className="mt-1 break-all rounded-md border bg-muted/50 p-2 text-sm">
							{viewData?.accessToken ?? t("dialog.loading")}
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
						if (!viewData?.accessKey) return;
						void navigator.clipboard
							.writeText(viewData.accessKey)
							.then(() =>
								toast({
									title: toastT("copy.successTitle"),
									description: toastT("copy.successDescription"),
								}),
							)
							.catch(() =>
								toast({
									title: toastT("copy.errorTitle"),
									description: toastT("copy.errorDescription"),
									variant: "destructive",
								}),
							);
					}}
						disabled={!viewData?.accessKey}
					>
						{t("dialog.copyKey")}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
						if (!viewData?.accessToken) return;
						void navigator.clipboard
							.writeText(viewData.accessToken)
							.then(() =>
								toast({
									title: toastT("copyToken.successTitle"),
									description: toastT("copyToken.successDescription"),
								}),
							)
							.catch(() =>
								toast({
									title: toastT("copyToken.errorTitle"),
									description: toastT("copyToken.errorDescription"),
									variant: "destructive",
								}),
							);
					}}
						disabled={!viewData?.accessToken}
					>
						{t("dialog.copyToken")}
					</Button>
					<Button type="button" onClick={() => setViewOpen(false)}>
						{t("dialog.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
			</Dialog>

			<Dialog
				open={isEditOpen}
				onOpenChange={(open) => {
					setEditOpen(open);
					if (!open) {
						setEditingId(null);
						setEditEmail("");
					}
				}}
			>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{t("dialog.editTitle")}</DialogTitle>
				<DialogDescription>{t("dialog.editDescription")}</DialogDescription>
			</DialogHeader>
			<form onSubmit={handleEditSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="edit-email">{t("dialog.emailLabel")}</Label>
							<Input
								id="edit-email"
								type="email"
								value={editEmail}
								onChange={(event) => setEditEmail(event.target.value)}
								required
								disabled={isEditing}
							/>
						</div>
						<DialogFooter>
				<Button
					type="button"
					variant="outline"
					onClick={() => setEditOpen(false)}
					disabled={isEditing}
				>
					{t("dialog.cancel")}
				</Button>
				<Button type="submit" disabled={isEditing}>
					{isEditing ? t("dialog.savePending") : t("dialog.save")}
				</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
