export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.RUNTIME_ENV_VALIDATION === "true"
  ) {
    const { validateProductionEnv } = await import("@/lib/env");
    validateProductionEnv();
  }
}
