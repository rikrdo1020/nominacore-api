import { Injectable, OnModuleInit } from '@nestjs/common';
import { RateRulesService } from './rate-rules/rate-rules.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private rateRulesService: RateRulesService) {}

  async onModuleInit() {
    await this.rateRulesService.seedDefaults();
  }
}
