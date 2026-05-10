import type { ApiErrorBody } from "@landshoppers/contracts";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toBody(): ApiErrorBody {
    const body: ApiErrorBody = {
      code: this.code,
      message: this.message,
    };
    if (this.details !== undefined) {
      body.details = this.details;
    }
    return body;
  }
}
