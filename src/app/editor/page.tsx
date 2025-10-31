import { KeywordEditorContainer } from "@/components/keyword-editor/keyword-editor-container";
import SiteHeader from "@/components/layout/site-header";
import { getMessages } from "../messages";

export default async function EditorPage() {
	const messages = await getMessages();

	return (
		<>
			<SiteHeader />
			<main className="flex-1">
				<section className="w-full py-16">
					<div className="mx-auto max-w-5xl px-4">
						<div className="mb-8 space-y-2">
							<h1 className="text-3xl font-semibold text-foreground">
								{messages.header.title}
							</h1>
							<p className="text-muted-foreground">
								{messages.header.description}
							</p>
						</div>
						<KeywordEditorContainer messages={messages} />
					</div>
				</section>
			</main>
		</>
	);
}
