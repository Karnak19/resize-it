"use client";

import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "./actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  return (
    <Button
      variant="destructive"
      onClick={() => deleteProjectAction(projectId)}
    >
      Delete Project
    </Button>
  );
}
