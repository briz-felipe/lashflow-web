// Route "/" is handled by app/page.tsx (Next.js gives precedence to non-group pages)
// This file exists to maintain the (dashboard) route group structure
// but is never served in practice.
import { redirect } from "next/navigation";

export default function DashboardGroupPage() {
  redirect("/");
}
