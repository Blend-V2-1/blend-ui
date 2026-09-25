import {
  Account,
  Address,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { SIMULATION_SOURCE_ACCOUNT } from './simulation';

export interface VoteNetwork {
  rpc: string;
  passphrase: string;
  opts?: rpc.Server.Options;
}

export interface VoteConfig {
  proposal: string;
  options: string[];
  totalEligibleShares: bigint;
  eligibleHolderCount: number;
}

export interface VoteRecord {
  option: number;
  shares: bigint;
}

export interface VoteOptionResult {
  option: number;
  label: string;
  shares: bigint;
  percentOfCast7dp: bigint;
  percentOfEligible7dp: bigint;
  voterCount: number;
}

export interface VoteResults {
  totalEligibleShares: bigint;
  totalVotedShares: bigint;
  participationPercent7dp: bigint;
  totalVoters: number;
  options: VoteOptionResult[];
}

export class VoteContractClient {
  private readonly contract: Contract;
  private readonly network: VoteNetwork;

  constructor(contractId: string, network: VoteNetwork) {
    if (!/^C[A-Z2-7]{55}$/.test(contractId)) {
      throw new Error('The vote contract is not configured for this network.');
    }
    this.contract = new Contract(contractId);
    this.network = network;
  }

  private async simulate(method: string, ...args: xdr.ScVal[]): Promise<any> {
    const server = new rpc.Server(this.network.rpc, this.network.opts);
    const source = new Account(SIMULATION_SOURCE_ACCOUNT, '0');
    const transaction = new TransactionBuilder(source, {
      fee: '100',
      networkPassphrase: this.network.passphrase,
    })
      .setTimeout(0)
      .addOperation(this.contract.call(method, ...args))
      .build();
    const simulation = await server.simulateTransaction(transaction);

    if (!rpc.Api.isSimulationSuccess(simulation) || simulation.result === undefined) {
      const message = rpc.Api.isSimulationError(simulation)
        ? simulation.error
        : `Unable to simulate ${method}.`;
      throw new Error(message);
    }
    return scValToNative(simulation.result.retval);
  }

  async getConfig(): Promise<VoteConfig> {
    const value = await this.simulate('get_config');
    return {
      proposal: value.proposal,
      options: value.options,
      totalEligibleShares: value.total_eligible_shares,
      eligibleHolderCount: value.eligible_holder_count,
    };
  }

  async getAllocation(holder: string): Promise<bigint> {
    return await this.simulate('get_allocation', Address.fromString(holder).toScVal());
  }

  async getVote(holder: string): Promise<VoteRecord | null> {
    const value = await this.simulate('get_vote', Address.fromString(holder).toScVal());
    if (value === null) return null;
    return { option: value.option, shares: value.shares };
  }

  async getResults(): Promise<VoteResults> {
    const value = await this.simulate('get_results');
    return {
      totalEligibleShares: value.total_eligible_shares,
      totalVotedShares: value.total_voted_shares,
      participationPercent7dp: value.participation_percent_7dp,
      totalVoters: value.total_voters,
      options: value.options.map((option: any) => ({
        option: option.option,
        label: option.label,
        shares: option.shares,
        percentOfCast7dp: option.percent_of_cast_7dp,
        percentOfEligible7dp: option.percent_of_eligible_7dp,
        voterCount: option.voter_count,
      })),
    };
  }

  async getVoters(option: number, start: number, limit: number): Promise<string[]> {
    return await this.simulate(
      'get_voters',
      nativeToScVal(option, { type: 'u32' }),
      nativeToScVal(start, { type: 'u32' }),
      nativeToScVal(limit, { type: 'u32' })
    );
  }

  vote(voter: string, option: number): xdr.Operation {
    return this.contract.call(
      'vote',
      Address.fromString(voter).toScVal(),
      nativeToScVal(option, { type: 'u32' })
    );
  }
}
