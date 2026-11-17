import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsUtcDateTime, trim } from '../../common/dto-helpers.js';

export class ListEventsQueryDto {
  @ApiPropertyOptional({ description: 'Free text matched against title, description and location' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Earliest start (ISO 8601 with timezone)' })
  @IsOptional()
  @IsUtcDateTime()
  from?: string;

  @ApiPropertyOptional({ description: 'Latest start (ISO 8601 with timezone)' })
  @IsOptional()
  @IsUtcDateTime()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}
