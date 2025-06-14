import { z } from "zod";

export const videoSearchQueryStringParamsSchema = z.object({
  queryStringParameters: z.object({}),
});
