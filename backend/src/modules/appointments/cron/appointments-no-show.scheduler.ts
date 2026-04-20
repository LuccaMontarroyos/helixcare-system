import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsService } from '../services/appointments.service';

@Injectable()
export class AppointmentsNoShowScheduler {
  private readonly logger = new Logger(AppointmentsNoShowScheduler.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleNoShows(): Promise<void> {
    try {
      const marked = await this.appointmentsService.processNoShows(30);
      if (marked > 0) {
        this.logger.log(`[NO_SHOW] ${marked} consulta(s) marcada(s) automaticamente.`);
      }
    } catch (err) {
      this.logger.error('[NO_SHOW] Falha no processamento automático.', err);
    }
  }
}