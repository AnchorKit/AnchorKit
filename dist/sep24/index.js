"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sep24Deposit = sep24Deposit;
exports.sep24Withdraw = sep24Withdraw;
exports.sep24Transaction = sep24Transaction;
exports.sep24Transactions = sep24Transactions;
const axios_1 = __importDefault(require("axios"));
function authHeaders(token) {
    return { Authorization: `Bearer ${token}` };
}
async function sep24Deposit(sep24Url, params, token) {
    const { data } = await axios_1.default.post(`${sep24Url}/transactions/deposit/interactive`, {
        asset_code: params.assetCode,
        account: params.account,
        amount: params.amount,
        memo: params.memo,
        memo_type: params.memoType,
        lang: params.lang,
    }, { headers: authHeaders(token) });
    return data;
}
async function sep24Withdraw(sep24Url, params, token) {
    const { data } = await axios_1.default.post(`${sep24Url}/transactions/withdraw/interactive`, {
        asset_code: params.assetCode,
        account: params.account,
        amount: params.amount,
        lang: params.lang,
    }, { headers: authHeaders(token) });
    return data;
}
async function sep24Transaction(sep24Url, id, token) {
    const { data } = await axios_1.default.get(`${sep24Url}/transaction`, { params: { id }, headers: authHeaders(token) });
    return data.transaction;
}
async function sep24Transactions(sep24Url, assetCode, token) {
    const { data } = await axios_1.default.get(`${sep24Url}/transactions`, { params: { asset_code: assetCode }, headers: authHeaders(token) });
    return data.transactions;
}
//# sourceMappingURL=index.js.map