import React from "react";
import { Button } from "./ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "./ui/breadcrumb";
import { ChevronRightIcon, FolderPlusIcon } from "lucide-react";

interface FileNavigationProps {
  currentPath: string[];
  onPathChange: (path: string[]) => void;
  onNewFolder: () => void;
  onRefresh: () => void;
}

export function FileNavigation({
  currentPath,
  onPathChange,
  onNewFolder,
  onRefresh,
}: FileNavigationProps) {
  const handleBreadcrumbClick = (index: number) => {
    onPathChange(currentPath.slice(0, index + 1));
  };

  const navigateToParent = () => {
    if (currentPath.length > 0) {
      onPathChange(currentPath.slice(0, -1));
    }
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-2">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => onPathChange([])}
              className="cursor-pointer"
            >
              Root
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentPath.map((part, index) => (
            <BreadcrumbItem key={index}>
              <ChevronRightIcon className="h-4 w-4" />
              <BreadcrumbLink
                onClick={() => handleBreadcrumbClick(index)}
                className="cursor-pointer"
              >
                {part}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewFolder}
          className="flex items-center"
        >
          <FolderPlusIcon className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
        {currentPath.length > 0 && (
          <Button variant="outline" size="sm" onClick={navigateToParent}>
            Up
          </Button>
        )}
      </div>
    </div>
  );
}
