import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';

export const ErrorResponseSchema = Type.Object({
  message: Type.String()
});

export type ErrorResponse = Static<typeof ErrorResponseSchema>;
