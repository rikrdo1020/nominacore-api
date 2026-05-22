import { Module } from '@nestjs/common';
import { RateRulesService } from './rate-rules.service';
import { RateRulesController } from './rate-rules.controller';

@Module({
  controllers: [RateRulesController],
  providers: [RateRulesService],
})
export class RateRulesModule {}
