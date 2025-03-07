"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { FileList } from "../../components/file-list";
import { UploadDialog } from "../../components/upload-dialog";
import { uploadObject, deleteObjectAction } from "../actions";
import { ObjectInfo, getPresignedUrl } from "../../lib/minio-client";
import { useRouter } from "next/navigation";

interface DashboardClientProps {
  initialFiles: ObjectInfo[];
  apiKey: string;
  bucketName: string;
}

export function DashboardClient({
  initialFiles,
  apiKey,
  bucketName,
}: DashboardClientProps) {
  const [files, setFiles] = useState<ObjectInfo[]>(initialFiles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const router = useRouter();

  const handleUpload = async (file: File, fileName: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);

      await uploadObject(formData, bucketName);
      // The page will be revalidated by the server action
      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file. Please try again.");
      throw err;
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      await deleteObjectAction(fileName, bucketName);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete file. Please try again.");
      throw err;
    }
  };

  const handleGetFileUrl = async (fileName: string) => {
    try {
      return await getPresignedUrl(fileName, bucketName);
    } catch (err) {
      console.error("Error getting file URL:", err);
      setError("Failed to get file URL. Please try again.");
      throw err;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Storage Dashboard</h1>
        <div className="flex space-x-2">
          <Button onClick={() => router.refresh()}>Refresh</Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            Upload File
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <FileList
          files={files}
          onDelete={handleDelete}
          onRefresh={() => router.refresh()}
          getFileUrl={handleGetFileUrl}
          apiKey={apiKey}
        />
      )}

      <UploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
}
