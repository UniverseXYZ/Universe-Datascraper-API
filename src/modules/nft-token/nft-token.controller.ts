import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ethers } from 'ethers';
import { NFTTokenOwnersService } from '../nft-token-owners/nft-token-owners.service';
import { GetSingleTokenDto } from './dto/get-single-token.dto';
import { GetMultipleTokenDto } from './dto/get-multiple-token.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NFTTokenService } from './nft-token.service';

@Controller('tokens')
@ApiTags('Tokens')
export class NFTTokenController {
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

  @Get(':contract/:tokenId')
  async getToken(@Param() param: GetSingleTokenDto) {
    const [token, tokenOwners] = await Promise.all([
      this.service.getToken(param.contract, param.tokenId),
      this.nftTokenOwnersService.getOwnersByContractAndTokenId(
        param.contract,
        param.tokenId,
      ),
    ]);
    const ownerAddresses = tokenOwners.map((owner) => ({
      owner: owner.address,
      value: owner.value,
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
  }

  @Get(':contract/:tokenIds')
  async getMultipleTokens(@Param() param: GetMultipleTokenDto) {
    const tokens = await this.service.getMultipleTokens(
      param.contract,
      param.tokenIds,
    );

    const tokenData = tokens.map((token) => ({
      contractAddress: token.contractAddress,
      tokenId: token.tokenId,
      tokenType: token.tokenType,
      metadata: token.metadata,
      externalDomainViewUrl: token.externalDomainViewUrl,
      alternativeMediaFiles: token.alternativeMediaFiles,
    }));

    return {
      tokenData,
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
