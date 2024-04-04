import { Injectable } from '@nestjs/common';
import {
  createPublicClient,
  http,
  formatEther,
  createWalletClient,
  Address,
} from 'viem';
import { sepolia } from 'viem/chains';
import * as tokenJson from './assets/MyToken.json';
import { ConfigService } from '@nestjs/config';
import { PublicClient, WalletClient } from 'viem/_types';
import { privateKeyToAccount } from 'viem/accounts';

@Injectable()
export class AppService {
  publicClient;
  walletClient: WalletClient;

  constructor(private configService: ConfigService) {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(this.configService.get<string>('RPC_ENDPOINT_URL')),
    });

    this.walletClient = createWalletClient({
      chain: sepolia,
      transport: http(this.configService.get<string>('RPC_ENDPOINT_URL')),
      key: process.env.PRIVATE_KEY,
      account: privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`),
    });
  }

  async mintTokens(address: any) {
    const hash = await this.walletClient.writeContract({
      address: process.env.TOKEN_ADDRESS as Address,
      account: privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`),
      chain: sepolia,
      abi: tokenJson.abi,
      functionName: 'mint',
      args: [address, 1n],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    console.log(`\nMinting tokens to ${address}`);
    console.log(`\nHash: ${hash}`);
    console.log(`\nReceipt: ${receipt}`);

    return { hash, receipt };
  }

  async checkMinterRole(address: string) {
    // grab the minter role keccak hash
    // pass it to _checkRole
    const minterRoleHash = await this.publicClient.readContract({
      address: process.env.TOKEN_ADDRESS,
      abi: tokenJson.abi,
      functionName: 'MINTER_ROLE',
    });
    const role: Promise<boolean> = await this.publicClient.readContract({
      address: process.env.TOKEN_ADDRESS,
      abi: tokenJson.abi,
      functionName: 'hasRole',
      args: [minterRoleHash, address],
    });

    return role;
  }

  async getServerWalletAddress() {
    const addresses = await this.walletClient.getAddresses();

    return addresses[0];
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
    return this.configService.get<string>('TOKEN_ADDRESS');
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
