import { ApiProperty } from '@nestjs/swagger';

export class GetMultipleTokenDto {
  @ApiProperty({
    description: 'NFT token contract address',
    required: true,
    type: String,
  })
  public readonly contract: string;

  @ApiProperty({
    description: 'NFT token IDs',
    required: true,
    type: [String],
  })
  public readonly tokenIds: string[];
}
