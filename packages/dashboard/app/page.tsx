import { redirect } from "next/navigation";

export default function HomePage() {
  // Check if SaaS mode is enabled
  const isSaasMode = process.env.SAAS_MODE === "true";

  if (isSaasMode) {
    // In SaaS mode, redirect to sign-in page
    redirect("/auth/sign-in");
  } else {
    // In non-SaaS mode, redirect to a page explaining that the dashboard is only available in SaaS mode
    redirect("/saas-required");
  }
}
