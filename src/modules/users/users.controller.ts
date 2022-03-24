import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../nft-token/dto/pagination.dto';
import { GetUserTokensDto } from '../nft-token/dto/get-user-tokens.dto';
import { NFTTokenService } from '../nft-token/nft-token.service';
import { NFTTransferService } from '../nft-transfer/nft-transfer.service';
import { OwnerDto } from './dto/owner.dto';
import { NFTTokenOwnersService } from '../nft-token-owners/nft-token-owners.service';
import { ethers } from 'ethers';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(
    private service: NFTTokenService,
    private transferService: NFTTransferService,
    private ownersService: NFTTokenOwnersService,
  ) {}

  @Get(':owner/tokens')
  async getTokensByOwner(
    @Param() ownerDto: OwnerDto,
    @Query() paginationQuery: PaginationDto,
    @Query() searchQuery: GetUserTokensDto,
  ) {
    const pageNum: number = paginationQuery.page ? paginationQuery.page - 1 : 0;
    const limit: number = paginationQuery.size ? paginationQuery.size : 10;

    // get records by address in token-owners collection
    const tokenOwners = await this.ownersService.getTokensByOwnerAddress(
      ownerDto.owner,
      searchQuery,
    );

    if (!tokenOwners.length) {
      return {
        page: pageNum,
        size: limit,
        total: 0,
        data: [],
      };
    }

    const [{ tokens, count }, owners] = await Promise.all([
      this.service.getTokensDetailsByTokens(
        tokenOwners,
        searchQuery,
        pageNum,
        limit,
      ),
      this.ownersService.getOwners(tokenOwners),
    ]);

    const data = tokens.map((token) => {
      const ownersInfo = owners.filter(
        (owner) =>
          owner.contractAddress === token.contractAddress &&
          owner.tokenId === token.tokenId,
      );
      const ownerAddresses = ownersInfo.map((owner) => ({
        owner: owner.address,
        value: owner.value
          ? owner.value.toString()
          : ethers.BigNumber.from(owner.value).toString(),
      }));
      return {
        contractAddress: token.contractAddress,
        tokenId: token.tokenId,
        tokenType: token.tokenType,
        metadata: token.metadata,
        externalDomainViewUrl: token.externalDomainViewUrl,
        alternativeMediaFiles: token.alternativeMediaFiles,
        owners: [...ownerAddresses],
      };
    });

    return {
      page: pageNum,
      size: limit,
      total: count,
      data,
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
