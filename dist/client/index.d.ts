import * as StellarSdk from '@stellar/stellar-sdk';
import { AnchorKitConfig, AnchorInfo, DepositParams, DepositResult, WithdrawParams, WithdrawResult, Sep31SendParams, Sep31SendResult, HealthStatus, Transaction } from '../types';
export declare class AnchorKit {
    private config;
    private cache;
    private anchors;
    constructor(config: AnchorKitConfig);
    /** Load and cache anchor info for all configured home domains */
    getAnchors(): Promise<AnchorInfo[]>;
    /** Fetch a single anchor by home domain */
    getAnchor(homeDomain: string): Promise<AnchorInfo>;
    /** Get a SEP-10 JWT for the given account/keypair against an anchor */
    auth(anchor: AnchorInfo, keypair: StellarSdk.Keypair): Promise<string>;
    sep6Deposit(anchor: AnchorInfo, params: DepositParams, token?: string): Promise<DepositResult>;
    sep6Withdraw(anchor: AnchorInfo, params: WithdrawParams, token?: string): Promise<WithdrawResult>;
    sep6Transaction(anchor: AnchorInfo, id: string, token?: string): Promise<Transaction>;
    sep6Transactions(anchor: AnchorInfo, assetCode: string, token?: string): Promise<Transaction[]>;
    sep24Deposit(anchor: AnchorInfo, params: DepositParams, token: string): Promise<DepositResult>;
    sep24Withdraw(anchor: AnchorInfo, params: WithdrawParams, token: string): Promise<WithdrawResult>;
    sep24Transaction(anchor: AnchorInfo, id: string, token: string): Promise<Transaction>;
    sep24Transactions(anchor: AnchorInfo, assetCode: string, token: string): Promise<Transaction[]>;
    sep31Send(anchor: AnchorInfo, params: Sep31SendParams, token: string): Promise<Sep31SendResult>;
    sep31Transaction(anchor: AnchorInfo, id: string, token: string): Promise<Transaction>;
    deposit(anchor: AnchorInfo, params: DepositParams, token: string): Promise<DepositResult>;
    withdraw(anchor: AnchorInfo, params: WithdrawParams, token: string): Promise<WithdrawResult>;
    health(): Promise<HealthStatus[]>;
    pickHealthyAnchor(): Promise<AnchorInfo>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map