import { z } from "zod";

import { getServerConfig } from "../config.server";

// Simple server-side helper. If you need to call this from the client, wire
// up an API endpoint (e.g., Vercel/Netlify function or Express route).
export async function getGreeting(data: { name: string }) {
  const schema = z.object({ name: z.string().min(1) });
  const parsed = schema.parse(data);
  const config = getServerConfig();
  return {
    greeting: `Hello, ${parsed.name}!`,
    mode: config.nodeEnv ?? "unknown",
  };
}
