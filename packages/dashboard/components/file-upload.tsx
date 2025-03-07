import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "../lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  className,
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setError(null);
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        setError("Invalid file type. Please upload an image file.");
      } else {
        setError("Error uploading file. Please try again.");
      }
    },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10 text-gray-400 mb-2"
          >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
          </svg>
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop the file here..."
              : "Drag & drop a file here, or click to select"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max file size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
