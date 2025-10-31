import Link from "next/link";

export const runtime = "edge";

export default function NotFoundPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<h1 className="text-4xl font-bold">页面未找到</h1>
			<p className="mt-2 text-muted-foreground">
				抱歉，我们没有找到你要访问的页面。
			</p>
			<Link
				href="/"
				className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
			>
				返回首页
			</Link>
		</div>
	);
}
