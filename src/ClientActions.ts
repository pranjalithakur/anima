import {Client} from "./Client";
import {Transaction} from "xrpl/dist/npm/models/transactions";
import {
    AccountCurrenciesResponse,
    AccountInfoResponse,
    AccountNFTsResponse,
    AccountOffersResponse, AccountTxResponse,
    Payment,
    SubmitResponse, Wallet
} from "xrpl";
import * as xrpl from "xrpl";
import {TxResponse} from "xrpl/dist/npm/models/methods";
import {AccountLinesResponse, Trustline} from "xrpl/dist/npm/models/methods/accountLines";
import {SubscribesData} from "./Types";
import {BaseRequest, BaseResponse} from "xrpl/dist/npm/models/methods/baseMethod";

export class ClientActions {
    private client: Client;
    private subscribes: SubscribesData;

    constructor(client:Client,subscribes:SubscribesData) {
        this.client=client;
        this.subscribes=subscribes;
    }

    async getAllAccountLines(data:{
        address:string;
        ledger_hash?:string;
        ledger_index?:string|number;
        peer?: string;
    }):Promise<Trustline[]> {
        let result:any = [];
        let marker=undefined;
        while (true) {
            try {
                console.log(`loaded lines: ${result.length}`);
                const resp:any = await this.getAccountLines({
                    address:data.address,
                    ledger_hash:data.ledger_hash,
                    ledger_index:data.ledger_index,
                    marker,
                    peer:data.peer,
                });
                result.push(...resp.result.lines);
                if(!resp.result.marker)
                    break;
                marker=resp.result.marker;
            } catch (e) {
                console.error(`getAllAccountLines [${data.address}] error: `,e);
                break;
            }
        }
        return result;
    }
    async getAccountLines(data:{
        address:string;
        ledger_hash?:string;
        ledger_index?:string|number;
        peer?: string;
        limit?:number;
        marker?:any;
    }):Promise<AccountLinesResponse> {
        const request = {
            "command": "account_lines",
            "account": data.address,
            "ledger_hash": data.ledger_hash,
            "ledger_index": data.ledger_index,
            "limit": data.limit,
            "marker": data.marker
        }
        return await this.request({request}) as AccountLinesResponse;
    }

    async getAccountTransactions(data:{
        address:string;
        ledger_index_min?:number;
        ledger_index_max?:number;
        ledger_hash?:string;
        ledger_index?:string|number;
        binary?: boolean;
        forward?: boolean;
        limit?:number;
        marker?:any;
    }):Promise<AccountTxResponse> {
        const request = {
            "command": "account_tx",
            "account": data.address,
            "ledger_index_max": data.ledger_index_max||-1,
            "ledger_index_min": data.ledger_index_min||-1,
            "ledger_hash": data.ledger_hash,
            "ledger_index": data.ledger_index,
            "binary": data.binary||false,
            "forward": data.forward||false,
            "limit": data.limit,
            "marker": data.marker
        }
        return await this.request({request}) as AccountTxResponse;
    }
    async getCurrencies(data:{
        address:string;
        ledger_hash?:string;
        ledger_index?:string|number;
        strict?:boolean;
    }):Promise<AccountCurrenciesResponse> {
        const request = {
            "command": "account_currencies",
            "account": data.address,
            "ledger_hash": data.ledger_hash,
            "ledger_index": data.ledger_index,
            "strict": data.strict
        };
        return await this.request({request}) as AccountCurrenciesResponse;
    }
    async getAccountInfo(data:{
        address:string;
        ledger_hash?:string;
        ledger_index?:string|number;
        queue?:boolean;
        signer_lists?:boolean;
        strict?:boolean;
    }):Promise<AccountInfoResponse> {
        try {
            const request = {
                "command": "account_info",
                "account": data.address,
                "ledger_hash": data.ledger_hash,
                "ledger_index": data.ledger_index,
                "queue": data.queue,
                "signer_lists": data.signer_lists,
                "strict": data.strict
            };
            return await this.request({request}) as AccountInfoResponse;
        } catch (e) {
            //todo handle empty accounts
            console.error("accountInfo error",e);
            return null;
        }
    }
    async getAccountOffers(data:{
        address:string;
        ledger_hash?:string;
        ledger_index?:string|number;
        limit?:number;
        marker?:any;
        strict?:boolean;
    }):Promise<AccountOffersResponse> {
        const request = {
            "command": "account_offers",
            "account": data.address,
            "ledger_hash": data.ledger_hash,
            "ledger_index": data.ledger_index,
            "limit": data.limit,
            "marker": data.marker,
            "strict": data.strict
        };
        return await this.request({request}) as AccountOffersResponse;
    }
    async getAccountNFTs(data:{
        address:string;
        ledger_hash?:string;
        ledger_index?:string|number;
        limit?:number;
        marker?:any;
    }):Promise<AccountNFTsResponse> {
        const request = {
            "command": "account_nfts",
            "account": data.address,
            "ledger_hash": data.ledger_hash,
            "ledger_index": data.ledger_index,
            "limit": data.limit,
            "marker": data.marker
        };
        return await this.request({request}) as AccountNFTsResponse;
    }
    async fund(data:{
        wallet: xrpl.Wallet;
        options?: {
            faucetHost?: string;
            faucetPath?: string;
            amount?: string;
        }
    }):Promise<{ wallet: Wallet; balance: number; }> {
        await this.client.awaitConnection();
        return await this.client.xrplClient.fundWallet(data.wallet,data.options);
    }
    async request(data: { request: BaseRequest }):Promise<BaseResponse> {
        await this.client.awaitConnection();
        return await this.client.xrplClient.request(data.request);
    }
    async submit(data:{
        transaction:Transaction;
        opts?: {
            autofill?: boolean;
            failHard?: boolean;
            wallet?: Wallet;
        };
        wait?:boolean
    }):Promise<any> {
        await this.client.awaitConnection();
        return await this.client.xrplClient[data.wait?"submitAndWait":"submit"](data.transaction,data.opts);
        //todo requests queue & priority
    }
    async prepareTransaction<T extends Transaction>(data:{transaction: T}):Promise<T> {
        await this.client.awaitConnection();
        return await this.client.xrplClient.autofill(data.transaction);
    }
    async pay(data:{
        payment: Payment;
        opts?: {
            autofill?: boolean;
            failHard?: boolean;
            wallet?: Wallet;
        };
        wait?:boolean
    }):Promise<TxResponse|SubmitResponse> {
        return await this.submit({
            transaction:data.payment,
            opts:data.opts,
            wait:data.wait
        });
    }
    async subscribe(subs?:SubscribesData) {
        if(subs)
            for(let key in subs) {
                this.subscribes[key] = Array.from(new Set([...subs[key],...this.subscribes[key]||[]]));
            }
        else subs = this.subscribes;
        const request:any = {
            "command": "subscribe"
        }
        for(let key in subs)
            if(subs[key].length>0) request[key]=subs[key];
        if(Object.keys(request).length>1) return await this.request({request});
    }
    async unsubscribe(subs?:SubscribesData) {
        if(subs)
            for(let key in subs) {
                const keySubs = new Set(this.subscribes[key]);
                for(let sub of subs[key])
                    keySubs.delete(sub);
                this.subscribes[key] = Array.from(keySubs);
            }
        else subs = this.subscribes;
        const request:any = {
            "command": "unsubscribe",
        }
        for(let key in subs)
            if(subs[key].length>0) request[key]=subs[key];
        if(Object.keys(request).length>1) return await this.request({request});
    }

}