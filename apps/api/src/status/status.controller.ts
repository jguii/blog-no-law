import { Controller, Get, Query } from '@nestjs/common';
import {
  statusQuerySchema,
  statusResponseSchema,
  type StatusQueryParsed,
  type StatusResponse,
} from '@blog/shared/status';
import { StatusService } from './status.service.js';

@Controller()
export class StatusController {
  constructor(private readonly status: StatusService) {}

  @Get('status')
  async get(@Query({ schema: statusQuerySchema }) q: StatusQueryParsed): Promise<StatusResponse> {
    // A saída também passa pelo contrato: a API nunca responde fora do que o web espera.
    return statusResponseSchema.parse(await this.status.snapshot(q.detail));
  }
}
