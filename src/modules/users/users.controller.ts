import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../nft-token/dto/pagination.dto';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTTransferService } from '../nft-transfer/nft-transfer.service';
import { OwnerDto } from './dto/owner.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(
    private service: NFTTokenService,
    private transferService: NFTTransferService,
  ) {}

  @Get(':owner/tokens')
  async getTokensByOwner(
    @Param() ownerDto: OwnerDto,
    @Query() query: PaginationDto,
  ) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    return this.service.getTokensByOwner(ownerDto.owner, pageNum, limit);
  }

  @Get(':owner/transfers')
  async getTransfersByUserAddress(
    @Param() ownerDto: OwnerDto,
    @Query() query: PaginationDto,
  ) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    return this.transferService.getTransferByUserAddress(
      ownerDto.owner,
      pageNum,
      limit,
    );
  }
}
