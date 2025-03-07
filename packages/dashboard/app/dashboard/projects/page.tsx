import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateProjectForm } from "./create-project-form";
import { deleteProject, getProjects } from "@/lib/data-access-layer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DeleteProjectButton } from "./delete-project-button";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const projects = await getProjects(session?.user?.id);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <CreateProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first project to get started
          </p>
          <CreateProjectForm />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Bucket: {project.bucketName}
                </p>
              </CardContent>
              <CardFooter>
                <DeleteProjectButton projectId={project.id} />
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    View Project
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
