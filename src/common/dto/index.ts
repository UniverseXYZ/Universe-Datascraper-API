import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { constants } from '../constants';

export class ContractAddressDto {
  @IsString()
  @IsNotEmpty()
  @Matches(constants.REGEX_ETHEREUM_ADDRESS, {
    message: constants.INVALID_CONTRACT_ADDRESS,
  })
  @ApiProperty({
    description: 'Contract address.',
    required: true,
  })
  public contract: string;
}