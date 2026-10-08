import type { paths } from '@/lib/api.generated';

export type ApiHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;

type SuccessfulResponseBody<Responses> = {
  [Status in keyof Responses]: Status extends SuccessStatus
    ? Responses[Status] extends { content: infer Content }
      ? Content[keyof Content]
      : never
    : never;
}[keyof Responses];

type OperationResponse<Operation> = Operation extends {
  responses: infer Responses;
}
  ? SuccessfulResponseBody<Responses>
  : never;

export type ApiResponse<
  Path extends keyof paths,
  Method extends ApiHttpMethod,
> = Method extends keyof paths[Path]
  ? OperationResponse<NonNullable<paths[Path][Method]>>
  : never;

type OperationRequestBody<Operation> = Operation extends {
  requestBody: { content: infer Content };
}
  ? Content[keyof Content]
  : never;

export type ApiRequestBody<
  Path extends keyof paths,
  Method extends ApiHttpMethod,
> = Method extends keyof paths[Path]
  ? OperationRequestBody<NonNullable<paths[Path][Method]>>
  : never;
