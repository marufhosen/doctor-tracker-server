export {};

declare global {
  namespace Express {
    type ValidatedRequestData = Partial<
      Record<'body' | 'query' | 'params', unknown>
    >;

    interface Request {
      validated: ValidatedRequestData;
    }
  }
}
