"use client";
import { createApiKey } from "@/app/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Project } from "db-schema";

export function CreateApiKeyForm({ projects }: { projects: Project[] }) {
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("projectId", projectId);

    const result = await createApiKey(formData);

    if (result.error) {
      setError(result.error);
      setIsCreating(false);
    } else if (result.apiKey) {
      setSuccess("API key created successfully!");
      setIsCreating(false);
      setName("");
      setProjectId("");
    }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Key name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            value={projectId}
            onValueChange={(value: string) => setProjectId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isCreating}>
            Create API Key
          </Button>
        </div>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
}
