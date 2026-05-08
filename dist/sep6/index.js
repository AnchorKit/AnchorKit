"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sep6Deposit = sep6Deposit;
exports.sep6Withdraw = sep6Withdraw;
exports.sep6Transaction = sep6Transaction;
exports.sep6Transactions = sep6Transactions;
const axios_1 = __importDefault(require("axios"));
function authHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}
async function sep6Deposit(sep6Url, params, token) {
    const { data } = await axios_1.default.get(`${sep6Url}/deposit`, {
        params: {
            asset_code: params.assetCode,
            account: params.account,
            amount: params.amount,
            memo: params.memo,
            memo_type: params.memoType,
            email_address: params.emailAddress,
            type: params.type,
            lang: params.lang,
        },
        headers: authHeaders(token),
    });
    return data;
}
async function sep6Withdraw(sep6Url, params, token) {
    const { data } = await axios_1.default.get(`${sep6Url}/withdraw`, {
        params: {
            asset_code: params.assetCode,
            account: params.account,
            amount: params.amount,
            dest: params.dest,
            dest_extra: params.destExtra,
            memo: params.memo,
            memo_type: params.memoType,
            type: params.type,
            lang: params.lang,
        },
        headers: authHeaders(token),
    });
    return data;
}
async function sep6Transaction(sep6Url, id, token) {
    const { data } = await axios_1.default.get(`${sep6Url}/transaction`, {
        params: { id },
        headers: authHeaders(token),
    });
    return data.transaction;
}
async function sep6Transactions(sep6Url, assetCode, token) {
    const { data } = await axios_1.default.get(`${sep6Url}/transactions`, {
        params: { asset_code: assetCode },
        headers: authHeaders(token),
    });
    return data.transactions;
}
//# sourceMappingURL=index.js.map