import { Hono } from "hono"

// Relative import so Next bundles the monorepo API (package export + .js suffix breaks on Vercel).
import { app as landshoppersApi } from "../../../../api/src/app"

const api = new Hono()
api.route("/api", landshoppersApi)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

async function handle(request: Request) {
  return api.fetch(request)
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
