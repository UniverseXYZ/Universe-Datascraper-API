import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class SearchCollectionParams {
  @ApiProperty({
    description: 'List of contract addresses',
    required: false,
    type: [String],
  })
  @IsOptional()
  contractAddresses?: [string];

  @ApiProperty({
    description: 'Contract address to search',
    required: false,
  })
  @IsOptional()
  search?: string;
}
