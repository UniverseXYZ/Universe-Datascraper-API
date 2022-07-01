import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ethers } from 'ethers';
import { NotFoundException } from '../../common/exceptions/NotFoundException';
import { NFTTokenOwnersService } from '../nft-token-owners/nft-token-owners.service';
import { GetSingleTokenDto } from './dto/get-single-token.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NFTTokenService } from './nft-token.service';
import { constants } from '../../common/constants';

@Controller('tokens')
@ApiTags('Tokens')
export class NFTTokenController {
  logger = new Logger(this.constructor.name);

  constructor(
    private service: NFTTokenService,
    private nftTokenOwnersService: NFTTokenOwnersService,
  ) {}

  @Get()
  async getTokens(@Query() query: PaginationDto) {
    const pageNum: number = query.page ? query.page - 1 : 0;
    const limit: number = query.size ? query.size : 10;
    const [tokens, count] = await Promise.all([
      this.service.getTokens(pageNum, limit),
      this.service.getCount(),
    ]);

    if (!tokens.length) {
      return {
        page: pageNum,
        size: limit,
        total: count,
        data: [],
      };
    }

    const tokenOwners = await this.nftTokenOwnersService.getOwnersByTokens(
      tokens,
    );
    const data = tokens.map((token) => {
      const ownersInfo = tokenOwners.filter(
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

  @Get(':contract/token-attributes')
  @ApiOperation({
    summary: 'Get token attributes',
  })
  async getTokenAttributes(@Param('contract') contract) {
    const result = await this.service.getTokenAttributes(contract);
    return result;
  }

  @Get(':contract/:tokenId')
  async getToken(@Param() param: GetSingleTokenDto) {
    const [token, tokenOwners] = await Promise.all([
      this.service.getToken(param.contract, param.tokenId),
      this.nftTokenOwnersService.getOwnersByContractAndTokenId(
        param.contract,
        param.tokenId,
      ),
    ]).catch((e) => {
      this.logger.error(e);
      throw new NotFoundException(constants.TOKEN_NOT_FOUND_ERROR);
    });
    return {
      contractAddress: token.contractAddress,
      tokenId: token.tokenId,
      tokenType: token.tokenType,
      metadata: token.metadata,
      externalDomainViewUrl: token.externalDomainViewUrl,
      alternativeMediaFiles: token.alternativeMediaFiles,
      owners: tokenOwners,
    };
  }

  @Put('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refreshToken(@Body() refreshTokenDto: GetSingleTokenDto) {
    await this.service.refreshTokenData(
      refreshTokenDto.contract,
      refreshTokenDto.tokenId,
    );
  }
}
