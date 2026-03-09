import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpsertCartItemDto {
  @IsString()
  menuItemCode!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;

  @IsOptional()
  @IsObject()
  modifiers?: Record<string, string[]>;
}
