import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SaasRequiredPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold mb-4">SaaS Mode Required</h1>
        <p className="text-lg text-gray-600 mb-8">
          This feature requires SaaS mode to be enabled. Please enable SaaS mode
          in your environment configuration to access this functionality.
        </p>
        <p className="text-gray-500 mb-8">
          Set <code className="bg-gray-100 p-1 rounded">SAAS_MODE=true</code> in
          your environment variables to enable SaaS mode.
        </p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
