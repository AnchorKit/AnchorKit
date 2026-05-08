"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sep31Info = sep31Info;
exports.sep31Send = sep31Send;
exports.sep31Transaction = sep31Transaction;
const axios_1 = __importDefault(require("axios"));
function authHeaders(token) {
    return { Authorization: `Bearer ${token}` };
}
async function sep31Info(sep31Url, token) {
    const { data } = await axios_1.default.get(`${sep31Url}/info`, {
        headers: authHeaders(token),
    });
    return data;
}
async function sep31Send(sep31Url, params, token) {
    const { data } = await axios_1.default.post(`${sep31Url}/transactions`, {
        amount: params.amount,
        asset_code: params.assetCode,
        asset_issuer: params.assetIssuer,
        destination_account: params.destinationAccount,
        destination_memo: params.destinationMemo,
        destination_memo_type: params.destinationMemoType,
        fields: params.fields,
        lang: params.lang,
    }, { headers: authHeaders(token) });
    return data;
}
async function sep31Transaction(sep31Url, id, token) {
    const { data } = await axios_1.default.get(`${sep31Url}/transactions/${id}`, { headers: authHeaders(token) });
    return data.transaction;
}
//# sourceMappingURL=index.js.map