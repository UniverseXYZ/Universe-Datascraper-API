import { ApiProperty } from '@nestjs/swagger';

export class OwnerDto {
  @ApiProperty({
    description: 'Owner address',
    required: true,
    type: String,
  })
  public readonly owner: string;
}
