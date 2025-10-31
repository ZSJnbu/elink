import { handlers } from "@/auth";

export const { GET, POST } = handlers;

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Removed Edge Runtime to avoid compatibility issues
// NextAuth needs Node.js runtime for full functionality
