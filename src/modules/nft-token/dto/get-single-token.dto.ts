import { ApiProperty } from '@nestjs/swagger';

export class GetSingleTokenDto {
  @ApiProperty({
    description: 'NFT token contract address',
    required: true,
    type: String,
  })
  public readonly contract: string;

  @ApiProperty({
    description: 'NFT token ID',
    required: true,
    type: String,
  })
  public readonly tokenId: string;
}
