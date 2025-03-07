"use client";

import { Table, TableBody, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreateApiKeyForm } from "./create-api-key-form";
import { revokeApiKey } from "@/app/actions/project-actions";
import { Copy } from "lucide-react";
import { useState } from "react";
import { Project, ApiKey } from "db-schema";

type Props = {
  apiKeys: { project: Project; api_key: ApiKey }[];
};

export function ApiKeysList({ apiKeys }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mt-8">
      {apiKeys.length === 0 ? (
        <EmptyApiKeys />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <tr>
                <th className="p-4 text-left font-medium">Name</th>
                <th className="p-4 text-left font-medium">Key</th>
                <th className="p-4 text-left font-medium">Created</th>
                <th className="p-4 text-left font-medium">Last Used</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </TableHeader>
            <TableBody>
              {apiKeys.map(({ api_key, project }) => {
                return (
                  <tr key={api_key.id} className="border-t">
                    <td className="p-4">{project.name}</td>
                    <td className="p-4 font-mono flex items-center gap-2">
                      <span className="truncate max-w-[200px]">
                        {api_key.key}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(api_key.key, api_key.id)}
                        title="Copy API key"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copy</span>
                      </Button>
                      {copiedId === api_key.id && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </td>
                    <td className="p-4">
                      {new Date(api_key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {api_key.lastUsed
                        ? new Date(api_key.lastUsed).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => revokeApiKey(api_key.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function EmptyApiKeys() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">
        No API keys found. Create one to get started.
      </p>
    </div>
  );
}
