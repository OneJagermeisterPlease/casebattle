export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const httpError = (status: number, message: string) => new HttpError(status, message);
