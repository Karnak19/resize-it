import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ImagesList } from "./images-list";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getApiKeysByProject,
  getProjectWithApiKeys,
} from "@/lib/data-access-layer";
import { ApiKeysList } from "../../api-keys/api-keys-list";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const [{ project }] = await getProjectWithApiKeys((await params).id);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.name} - Project Details`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [{ project }] = await getProjectWithApiKeys((await params).id);
  const apiKeys = await getApiKeysByProject(project?.id);

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Project Not Found</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard/projects">Back to Projects</Link>
          </Button>
        </div>
        <p>
          The project you're looking for doesn't exist or you don't have access
          to it.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/projects">Back to Projects</Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                View and manage your project details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project ID</Label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {project.id}
                </p>
              </div>
              <div>
                <Label>Bucket Name</Label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {project.bucketName}
                </p>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="text-sm bg-gray-100 p-2 rounded">
                  {new Date(project.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysList
            apiKeys={apiKeys.map((apiKey) => ({
              api_key: apiKey,
              project: project,
            }))}
          />
        </TabsContent>

        <TabsContent value="images">
          <ImagesList
            projectId={project.id}
            bucketName={project.bucketName}
            apiKey={apiKeys[0].key}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
