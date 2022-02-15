import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number (minimum 1)',
    required: false,
    minimum: 1,
    type: Number,
  })
  public readonly page?: number;

  @ApiProperty({
    description: 'Page size (maximum 100)',
    required: false,
    type: Number,
    maximum: 100,
  })
  public readonly size?: number;
}
