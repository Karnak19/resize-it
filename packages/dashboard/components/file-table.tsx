import React from "react";
import { Button } from "./ui/button";
import { formatBytes, formatDate, getFileTypeFromName } from "../lib/utils";
import { FileIcon } from "./file-icon";
import { ObjectInfo } from "../lib/minio-service";
import { ResizeItImage } from "./ui/image";

export interface FileItem extends ObjectInfo {
  isFolder: boolean;
  children?: FileItem[];
}

interface FileTableProps {
  files: FileItem[];
  onFolderClick: (folder: FileItem) => void;
  onFileView: (file: FileItem) => void;
  onFileDelete: (file: FileItem) => void;
  apiKey?: string;
}

export function FileTable({
  files,
  onFolderClick,
  onFileView,
  onFileDelete,
  apiKey,
}: FileTableProps) {
  const getFileName = (file: FileItem) => {
    return file.name.split("/").pop() || file.name;
  };

  const isImageFile = (file: FileItem) => {
    return !file.isFolder && getFileTypeFromName(file.name) === "image";
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg">
        <p className="text-gray-500">No files found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Size
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Modified
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr
              key={file.name}
              className={`hover:bg-gray-50 ${
                file.isFolder ? "cursor-pointer" : ""
              }`}
              onClick={file.isFolder ? () => onFolderClick(file) : undefined}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {isImageFile(file) ? (
                      <div className="relative h-10 w-10 rounded-md overflow-hidden">
                        <ResizeItImage
                          src={file.name}
                          apiKey={apiKey}
                          alt={getFileName(file)}
                          fill
                          objectFit="cover"
                          width={40}
                          height={40}
                          resizeOptions={{
                            format: "webp",
                            quality: 90,
                          }}
                        />
                      </div>
                    ) : (
                      <FileIcon file={file} />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {getFileName(file)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {file.isFolder ? "-" : formatBytes(file.size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {file.isFolder ? "-" : formatDate(file.lastModified)}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {!file.isFolder && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileView(file)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileDelete(file)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Button>
                  </>
                )}
                {file.isFolder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileDelete(file)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
