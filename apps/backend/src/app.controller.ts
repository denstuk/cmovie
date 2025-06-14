import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";

/**
 * Used by Load Balancer to check if the service is healthy.
 */
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Used by Load Balancer to check if the service is healthy.',
  })
  @ApiOkResponse({
    description: 'Service is healthy',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: 'OK',
        },
      }
    },
  })
  health(): string {
    return 'OK';
  }
}
