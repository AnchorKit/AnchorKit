import { DepositParams, DepositResult, WithdrawParams, WithdrawResult, Transaction } from '../types';
export declare function sep6Deposit(sep6Url: string, params: DepositParams, token?: string): Promise<DepositResult>;
export declare function sep6Withdraw(sep6Url: string, params: WithdrawParams, token?: string): Promise<WithdrawResult>;
export declare function sep6Transaction(sep6Url: string, id: string, token?: string): Promise<Transaction>;
export declare function sep6Transactions(sep6Url: string, assetCode: string, token?: string): Promise<Transaction[]>;
//# sourceMappingURL=index.d.ts.map