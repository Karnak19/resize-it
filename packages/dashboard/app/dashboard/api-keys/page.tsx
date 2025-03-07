import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { getApiKeysWithProjects, getProjects } from "@/lib/data-access-layer";
import { apiKey, project } from "db-schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody } from "@/components/ui/table";
import { CreateApiKeyForm } from "./create-api-key-form";
import { ApiKeysList } from "./api-keys-list";

export default async function ApiKeysPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const apiKeys = await getApiKeysWithProjects(session.user.id);
  const projects = await getProjects(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">API Keys</h1>
      <div className="mt-8">
        <ApiKeysList apiKeys={apiKeys} />
      </div>
      <CreateApiKeyForm projects={projects} />
    </div>
  );
}
