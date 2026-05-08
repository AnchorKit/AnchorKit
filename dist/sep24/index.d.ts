import { DepositParams, DepositResult, WithdrawParams, WithdrawResult, Transaction } from '../types';
export declare function sep24Deposit(sep24Url: string, params: DepositParams, token: string): Promise<DepositResult>;
export declare function sep24Withdraw(sep24Url: string, params: WithdrawParams, token: string): Promise<WithdrawResult>;
export declare function sep24Transaction(sep24Url: string, id: string, token: string): Promise<Transaction>;
export declare function sep24Transactions(sep24Url: string, assetCode: string, token: string): Promise<Transaction[]>;
//# sourceMappingURL=index.d.ts.map