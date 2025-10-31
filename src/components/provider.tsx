"use client";

import { SessionProvider } from "next-auth/react";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { timeZone } from "@/i18n/config";

interface ProvidersProps {
	children: React.ReactNode;
	messages: AbstractIntlMessages;
	locale: string;
}

export function Providers({ children, messages, locale }: ProvidersProps) {
	return (
		<SessionProvider basePath="/api/auth">
			<NextIntlClientProvider
				messages={messages}
				locale={locale}
				timeZone={timeZone}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</NextIntlClientProvider>
		</SessionProvider>
	);
}
