/**
 * Next.js Instrumentation hook.
 * Called once when the server starts.
 * We use it to auto-start the Discord bot if configured.
 */
export async function register() {
  // Only run on the server (Node.js runtime), not in Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import to avoid bundling discord.js in edge runtime
    const { autoStartBot } = await import("@/lib/discord/bot");

    // Delay slightly to let the DB connection pool initialize
    setTimeout(async () => {
      try {
        const started = await autoStartBot();
        if (started) {
          console.log("[Instrumentation] Discord bot auto-started successfully");
        } else {
          console.log("[Instrumentation] Discord bot not configured, skipping");
        }
      } catch (error) {
        console.error("[Instrumentation] Discord bot auto-start failed:", error);
      }
    }, 3000);
  }
}
