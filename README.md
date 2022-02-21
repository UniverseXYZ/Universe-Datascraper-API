# Universe Datascraper API

## Description

This service provides APIs to access scraped data.

## Requirements

- NodeJS version 14+
- NPM

## Required External Service

- MongoDB

## Primary Third Party Libraries

- NestJS
- Mongoose (MongoDB)

## Installation

```bash
npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Swagger

To check API doc, use the similar link below:
<http://localhost:3000/v1/doc>

## MongoDB Collection Usage

This consumer leverage the following data collection in [schema](https://github.com/plugblockchain/Universe-Datascraper-Schema)

- NFT Tokens
- NFT Transfers
