import { passkeyClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [passkeyClient()],
});

export const { signIn, signUp, signOut, useSession, passkey } = client;
export default client;
