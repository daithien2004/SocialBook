export interface ProblemDetailsDto {
  type: 'about:blank';
  title: string;
  status: number;
  code: string;
  detail: string;
  traceId: string;
  errors?: Array<{ field: string; code: string; message: string }>;
}
