export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Force-load .env.local, overriding any pre-existing shell env vars.
    // Needed because the Claude Code shell sets ANTHROPIC_API_KEY="" which
    // Next.js's loader (which doesn't override) then preserves.
    const { config } = await import("dotenv");
    config({ path: ".env.local", override: true });
  }
}
