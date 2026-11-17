import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsUtcDateTime, trim } from '../../common/dto-helpers.js';

export class CreateEventDto {
  @ApiProperty({ maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({ maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ maxLength: 200 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @ApiProperty({ example: '2027-03-20T16:00:00Z', description: 'ISO 8601 with timezone' })
  @IsUtcDateTime()
  startsAt: string;

  @ApiProperty({ example: '2027-03-20T18:00:00Z', description: 'ISO 8601 with timezone' })
  @IsUtcDateTime()
  endsAt: string;

  @ApiProperty({ minimum: 1, maximum: 100000 })
  @IsInt()
  @Min(1)
  @Max(100000)
  capacity: number;
}
