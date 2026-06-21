// Lovable integration removed. This file provides a no-op shim so existing
// imports remain valid while we clean up telemetry integrations.
export function reportLovableError(_error: unknown, _context: Record<string, unknown> = {}) {
  // no-op
}
