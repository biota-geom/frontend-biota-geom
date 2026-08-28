export class ApiError extends Error {
  readonly status: number;
  readonly isNetworkError: boolean;

  constructor(
    status: number,
    message: string,
    options: { isNetworkError?: boolean } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = options.isNetworkError ?? false;
  }
}
