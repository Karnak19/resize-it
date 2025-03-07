import { DashboardClient } from "../../dashboard-client";
import { ErrorBoundary } from "@/components/error-boundary";
import { listObjects } from "@/lib/minio-server";
import { MinioService } from "@/lib/minio-service";

interface ImagesListProps {
  projectId: string;
  bucketName: string;
  apiKey: string;
}

export async function ImagesList({
  projectId,
  bucketName,
  apiKey,
}: ImagesListProps) {
  const files = await listObjects(bucketName);
  return (
    <ErrorBoundary>
      <DashboardClient
        initialFiles={files}
        apiKey={apiKey}
        bucketName={bucketName}
      />
    </ErrorBoundary>
  );
}
