import { ApiProperty } from '@nestjs/swagger';

export class GetUserTokensDto {
  @ApiProperty({
    description: 'Token Type',
    required: false,
    type: String,
  })
  public readonly tokenType: string;
}
