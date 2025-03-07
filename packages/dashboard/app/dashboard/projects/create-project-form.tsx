"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProject } from "@/app/actions/project-actions";

export function CreateProjectForm() {
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", newProject.name);
      formData.append("description", newProject.description || "");

      const result = await createProject(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        setNewProject({ name: "", description: "" });
        setIsCreating(false);
        toast.success("Project created successfully!");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  if (!isCreating) {
    return (
      <Button onClick={() => setIsCreating(true)}>Create New Project</Button>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>
          Create a new project to organize your images and API keys
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleCreateProject}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Project"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A brief description of your project"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({
                  ...newProject,
                  description: e.target.value,
                })
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setIsCreating(false)}>
            Cancel
          </Button>
          <Button type="submit">Create Project</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
