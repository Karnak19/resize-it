import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { getFileTypeFromName } from "../lib/utils";
import { ObjectInfo } from "../lib/minio-service";
import { ResizeItImage } from "./ui/image";

interface ViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: ObjectInfo | null;
  fileUrl: string | null;
  apiKey?: string;
}

export function ViewDialog({
  isOpen,
  onOpenChange,
  selectedFile,
  fileUrl,
  apiKey,
}: ViewDialogProps) {
  if (!selectedFile || !fileUrl) return null;

  // Extract the image path from the URL for ResizeIt
  const getImagePath = () => {
    // If the URL is from S3/MinIO, extract just the object path
    if (selectedFile && selectedFile.name) {
      return selectedFile.name;
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedFile.name.split("/").pop()}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center">
          {getFileTypeFromName(selectedFile.name) === "image" ? (
            <div className="relative h-96 w-full">
              <ResizeItImage
                src={getImagePath()}
                alt={selectedFile.name}
                apiKey={apiKey}
                fill
                objectFit="contain"
                resizeOptions={{
                  format: "webp",
                  quality: 90,
                }}
                className="rounded-md"
              />
            </div>
          ) : getFileTypeFromName(selectedFile.name) === "video" ? (
            <video src={fileUrl} controls className="max-h-96 max-w-full" />
          ) : getFileTypeFromName(selectedFile.name) === "audio" ? (
            <audio src={fileUrl} controls className="w-full" />
          ) : (
            <div className="p-4 text-center">
              <p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Download File
                </a>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: ObjectInfo | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteDialog({
  isOpen,
  onOpenChange,
  selectedFile,
  isDeleting,
  onConfirm,
}: DeleteDialogProps) {
  if (!selectedFile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to delete{" "}
          <span className="font-semibold">
            {selectedFile.name.split("/").pop()}
          </span>
          ? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NewFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string[];
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onConfirm: () => Promise<void>;
}

export function NewFolderDialog({
  isOpen,
  onOpenChange,
  currentPath,
  folderName,
  onFolderNameChange,
  onConfirm,
}: NewFolderDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Create a new folder in{" "}
            <span className="font-semibold">
              {currentPath.length === 0 ? "Root" : currentPath.join("/")}
            </span>
          </p>
          <Input
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => onFolderNameChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onFolderNameChange("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={!folderName.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
