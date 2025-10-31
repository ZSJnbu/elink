"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useKeywordEditorStore } from "@/stores/keyword-editor";

interface ClearEditorButtonProps {
	onReset?: () => void;
	disabled?: boolean;
}

export function ClearEditorButton({
	onReset,
	disabled = false,
}: ClearEditorButtonProps) {
	const t = useTranslations("keyword-editor.actions");
	const resetToInitialState = useKeywordEditorStore((state) => state.resetToInitialState);
	const isLoading = useKeywordEditorStore((state) => state.isLoading);

	const handleClick = useCallback(() => {
		onReset?.();
		resetToInitialState();
	}, [onReset, resetToInitialState]);

	return (
		<Button
			type="button"
			variant="outline"
			onClick={handleClick}
			disabled={disabled || isLoading}
			data-testid="clear-editor-button"
		>
			{t("reset")}
		</Button>
	);
}
