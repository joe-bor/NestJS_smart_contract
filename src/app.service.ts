import { Injectable } from '@nestjs/common';
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import * as tokenJson from './assets/MyToken.json';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  publicClient;

  constructor(private configService: ConfigService) {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(this.configService.get<string>('RPC_ENDPOINT_URL')),
    });
  }

  async getTransactionReceipt(hash: string) {
    // tx hash 0x662019ce6e580e35773a6091f005fa5373b752ee8e0881ebf017d3f5fa656970
    const receipt = await this.publicClient.getTransactionReceipt({
      hash: hash,
    });
    return receipt;
  }

  async getTokenBalance(address: string): Promise<string> {
    const tokenBalance = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'balanceOf',
      args: [address],
    });

    return formatEther(tokenBalance);
  }

  async getTotalSupply() {
    const totalSupply = await this.publicClient.readContract({
      address: this.getContractAddress(),
      abi: tokenJson.abi,
      functionName: 'totalSupply',
    });
    return formatEther(totalSupply);
  }

  getHello(): string {
    return 'Hello World!';
  }

  getContractAddress() {
    return '0xD38d61ab91E134D01a6DbB48b0D2a0C181B4B936';
  }

  async getTokenName(): Promise<any> {
    const name = await this.publicClient.readContract({
      address: this.getContractAddress() as `0x${string}`,
      abi: tokenJson.abi,
      functionName: 'name',
    });
    return name;
  }
}
