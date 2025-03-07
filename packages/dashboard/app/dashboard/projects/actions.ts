"use server";

import { deleteProject } from "@/lib/data-access-layer";
import { revalidatePath } from "next/cache";

export async function deleteProjectAction(projectId: string) {
  await deleteProject(projectId);
  revalidatePath("/dashboard/projects");
}
