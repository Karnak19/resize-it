import React, { useState, useEffect } from "react";
import { ObjectInfo } from "../lib/minio-service";
import { FileNavigation } from "./file-navigation";
import { FileTable, FileItem } from "./file-table";
import { ViewDialog, DeleteDialog, NewFolderDialog } from "./file-dialogs";

interface FileListProps {
  files: ObjectInfo[];
  onDelete: (fileName: string) => Promise<void>;
  onRefresh: () => void;
  getFileUrl: (fileName: string) => Promise<string>;
  apiKey?: string;
}

export function FileList({
  files,
  onDelete,
  onRefresh,
  getFileUrl,
  apiKey,
}: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<ObjectInfo | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [fileStructure, setFileStructure] = useState<FileItem[]>([]);

  // Process files into a hierarchical structure
  useEffect(() => {
    const processFiles = () => {
      const structure: FileItem[] = [];
      const folderMap: Record<string, FileItem> = {};

      // First pass: identify all folders
      files.forEach((file) => {
        const pathParts = file.name.split("/").filter(Boolean);

        // Skip files not in the current path
        if (currentPath.length > 0) {
          const filePath = pathParts.slice(0, currentPath.length).join("/");
          const currentPathStr = currentPath.join("/");
          if (filePath !== currentPathStr) {
            return;
          }
        }

        // If we're in a subfolder, we only want to show direct children
        if (pathParts.length > currentPath.length + 1) {
          // This is a file in a subfolder of the current folder
          const folderName = pathParts[currentPath.length];
          const folderPath =
            currentPath.length === 0
              ? folderName
              : `${currentPath.join("/")}/${folderName}`;

          if (!folderMap[folderPath]) {
            const folderItem: FileItem = {
              name: folderPath,
              lastModified: new Date(),
              size: 0,
              etag: "",
              isFolder: true,
              children: [],
            };
            folderMap[folderPath] = folderItem;
            structure.push(folderItem);
          }
        } else if (
          pathParts.length === currentPath.length + 1 ||
          (currentPath.length === 0 && pathParts.length === 1)
        ) {
          // This is a direct child of the current folder
          structure.push({
            ...file,
            isFolder: false,
          });
        } else if (
          pathParts.length === currentPath.length &&
          currentPath.length > 0
        ) {
          // This is the current folder itself, skip it
          return;
        } else if (pathParts.length === 0 && currentPath.length === 0) {
          // This is a file in the root folder
          structure.push({
            ...file,
            isFolder: false,
          });
        }
      });

      // Sort: folders first, then files alphabetically
      structure.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      setFileStructure(structure);
    };

    processFiles();
  }, [files, currentPath]);

  const handleView = async (file: FileItem) => {
    setSelectedFile(file);
    // We still need to get the direct URL for non-image files
    const url = await getFileUrl(file.name);
    setFileUrl(url);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (file: FileItem) => {
    setSelectedFile(file);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;

    setIsDeleting(true);
    try {
      await onDelete(selectedFile.name);
      setIsDeleteDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFolderClick = (folder: FileItem) => {
    const pathParts = folder.name.split("/").filter(Boolean);
    setCurrentPath(pathParts);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderPath =
      currentPath.length === 0
        ? `${newFolderName}/.keep`
        : `${currentPath.join("/")}/${newFolderName}/.keep`;

    try {
      // Create an empty file to represent the folder
      // This is a common approach for S3-compatible storage
      const emptyBuffer = Buffer.from("");
      await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: folderPath,
          contentType: "application/octet-stream",
          fileContent: "",
        }),
      });

      setIsNewFolderDialogOpen(false);
      setNewFolderName("");
      onRefresh();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  return (
    <div className="w-full">
      <FileNavigation
        currentPath={currentPath}
        onPathChange={setCurrentPath}
        onNewFolder={() => setIsNewFolderDialogOpen(true)}
        onRefresh={onRefresh}
      />

      <FileTable
        files={fileStructure}
        onFolderClick={handleFolderClick}
        onFileView={handleView}
        onFileDelete={handleDelete}
        apiKey={apiKey}
      />

      <ViewDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        selectedFile={selectedFile}
        fileUrl={fileUrl}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedFile={selectedFile}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
      />

      <NewFolderDialog
        isOpen={isNewFolderDialogOpen}
        onOpenChange={setIsNewFolderDialogOpen}
        currentPath={currentPath}
        folderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        onConfirm={handleCreateFolder}
      />
    </div>
  );
}
