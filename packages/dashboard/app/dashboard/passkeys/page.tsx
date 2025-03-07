import { AddPasskeyButton } from "@/components/auth/add-passkey-button";

export default function PasskeysPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Passkey Management</h1>
      <p className="mb-6 text-gray-600">
        Passkeys are a more secure alternative to passwords. They use your
        device's biometric authentication (like fingerprint or face recognition)
        or a security key to sign you in without a password.
      </p>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Add a Passkey</h2>
        <AddPasskeyButton />
      </div>
    </div>
  );
}
