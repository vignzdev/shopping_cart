import {
  DomainError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@shared/domain/errors";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();

  if (!text.trim()) {
    throw new ValidationError("Request body is required");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}

export function toErrorResponse(error: unknown): Response {
  if (isZodError(error)) {
    return json({ error: "Validation failed", issues: error.issues }, 400);
  }

  if (error instanceof NotFoundError) {
    return json({ error: error.message }, 404);
  }

  if (error instanceof InsufficientStockError) {
    return json({ error: error.message }, 409);
  }

  if (error instanceof ValidationError || error instanceof DomainError) {
    return json({ error: error.message }, 400);
  }

  console.error(error);
  return json({ error: "Internal server error" }, 500);
}

function isZodError(error: unknown): error is { issues: unknown[] } {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues) &&
    "name" in error &&
    (error as { name: string }).name === "ZodError"
  );
}
