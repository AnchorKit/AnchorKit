import { Sep31SendParams, Sep31SendResult, Transaction } from '../types';
export interface Sep31Info {
    receive: Record<string, {
        enabled: boolean;
        fee_fixed?: number;
        fee_percent?: number;
        min_amount?: number;
        max_amount?: number;
        fields?: {
            transaction?: Record<string, {
                description: string;
                optional?: boolean;
            }>;
            sender?: Record<string, {
                description: string;
                optional?: boolean;
            }>;
            receiver?: Record<string, {
                description: string;
                optional?: boolean;
            }>;
        };
    }>;
}
export declare function sep31Info(sep31Url: string, token: string): Promise<Sep31Info>;
export declare function sep31Send(sep31Url: string, params: Sep31SendParams, token: string): Promise<Sep31SendResult>;
export declare function sep31Transaction(sep31Url: string, id: string, token: string): Promise<Transaction>;
//# sourceMappingURL=index.d.ts.map