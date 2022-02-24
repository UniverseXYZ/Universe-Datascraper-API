import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../nft-token/dto/pagination.dto';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
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
    @Query() paginationQuery: PaginationDto,
    @Query() searchQuery: GetUserTokensDto,
  ) {
    const pageNum: number = paginationQuery.page ? paginationQuery.page - 1 : 0;
    const limit: number = paginationQuery.size ? paginationQuery.size : 10;

    const [tokens, count] = await Promise.all([
      this.service.getTokensByOwner(
        ownerDto.owner,
        searchQuery,
        pageNum,
        limit,
      ),
      this.service.getCountByOwner(ownerDto.owner, searchQuery),
    ]);
    return {
      page: pageNum,
      size: limit,
      total: count,
      data: tokens,
    };
  }

  @Get(':owner/transfers')
  async getTransfersByUserAddress(
    @Param() ownerDto: OwnerDto,
    @Query() query: PaginationDto,
  ) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    const [transfers, count] = await Promise.all([
      this.transferService.getTransferByUserAddress(
        ownerDto.owner,
        pageNum,
        limit,
      ),
      this.transferService.getCountByUserAddress(ownerDto.owner),
    ]);
    return {
      page: pageNum,
      size: limit,
      total: count,
      data: transfers,
    };
  }
}
