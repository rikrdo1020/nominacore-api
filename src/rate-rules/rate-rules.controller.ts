import { Controller, Get, Put, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RateRulesService } from './rate-rules.service';
import { UpdateRateRuleDto } from './dto/update-rate-rule.dto';

@Controller('rate-rules')
export class RateRulesController {
  constructor(private readonly rateRulesService: RateRulesService) {}

  @Get()
  findAll() {
    return this.rateRulesService.findAll();
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRateRuleDto) {
    return this.rateRulesService.update(id, dto);
  }
}
