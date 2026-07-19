export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const assertFound = <T>(value: T | undefined | null, message = 'Resource not found') => {
  if (!value) {
    throw new HttpError(404, message);
  }

  return value;
};

export const nowIso = () => new Date().toISOString();

export const currency = (value: number) => Math.round(value * 100) / 100;
