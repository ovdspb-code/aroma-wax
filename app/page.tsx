import { LoginScreen } from "@/components/login-screen";
import { ClpTool } from "@/components/clp-tool";
import { hasAccess } from "@/lib/password";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [access, params] = await Promise.all([hasAccess(), searchParams]);

  if (!access) {
    return <LoginScreen showError={params.error === "1"} />;
  }

  return <ClpTool />;
}
