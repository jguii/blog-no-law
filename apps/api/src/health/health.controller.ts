import { Controller, Get } from '@nestjs/common';

// Health check da plataforma (Render): processo vivo, nenhuma dependência injetada.
// Se dependesse do banco, uma oscilação do Supabase causaria loop de restart.
@Controller('health')
export class HealthController {
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
