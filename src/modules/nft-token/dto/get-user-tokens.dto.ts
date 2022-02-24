import { ApiProperty } from '@nestjs/swagger';

export class GetUserTokensDto {
  @ApiProperty({
    description: 'Token Type',
    required: false,
    type: String,
  })
  public readonly tokenType: string;

  @ApiProperty({
    description: 'Token Address',
    required: false,
    type: String,
  })
  public readonly tokenAddress: string;

  @ApiProperty({
    description: 'Search keyword',
    required: false,
    type: String,
  })
  public readonly search: string;
}
