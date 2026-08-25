import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ExtractImageDto, MAX_IMAGES_PER_BATCH } from '../../common/dto/extract-image.dto';

export class ExtractWorkRecordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMAGES_PER_BATCH)
  @ValidateNested({ each: true })
  @Type(() => ExtractImageDto)
  images: ExtractImageDto[];
}
