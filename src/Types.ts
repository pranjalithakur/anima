export interface WalletData {
    auth_type:AuthType,
    auth_data:string
}
export enum AuthType {
    "seed"="seed",
    "mnemonic"="mnemonic",
    "numbers"="numbers"
}
export enum Streams {
    consensus="consensus",
    ledger="ledger",
    manifests="manifests",
    peer_status="peer_status",
    transactions="transactions",
    transactions_proposed="transactions_proposed",
    server="server",
    validations="validations",
}

export interface SubscribesData {
    streams: Streams[]
    accounts: string[]
    accounts_proposed: string[]
    books: string[]
    [key:string]: string[]
}