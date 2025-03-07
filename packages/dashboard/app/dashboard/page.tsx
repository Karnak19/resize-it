import { listObjects } from "../../lib/minio-server";
import { DashboardClient } from "./dashboard-client";
import { ErrorBoundary } from "../../components/error-boundary";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Fetch files using server component

  if (process.env.SAAS_MODE === "true") {
    redirect("/saas-required");
  }

  const files = await listObjects(process.env.S3_BUCKET || "images");

  return (
    <ErrorBoundary>
      <DashboardClient initialFiles={files} />
    </ErrorBoundary>
  );
}
