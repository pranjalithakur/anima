import {convertHexToString, convertStringToHex, Wallet} from "xrpl";
import assert from "assert";
import keypairs from 'ripple-keypairs';

export const delay = (ms:number=100) => new Promise(resolve => setTimeout(resolve,ms));

export const publicServers = {
    Mainnet: "wss://s2.ripple.com",
    Testnet: "wss://s.altnet.rippletest.net:51233",
    Devnet: "wss://s.devnet.rippletest.net:51233",
    AMMDevnet: "wss://amm.devnet.rippletest.net:51233"
}
export function hex2str(hexStr:string):string {
    let str = '';
    for (let n = 0; n < hexStr.length; n += 2) {
        const val = parseInt(hexStr.substr(n, 2),16);
        if(val!=0)
            str += val;
    }
    return convertHexToString(str);
}
export function str2hex(str:string, length?:number):string {
    let result = convertStringToHex(str);
    while(length && result.length<length) result+='0';
    return result;
}
export function secretToEntropy(secret: Array<string>): Buffer {
    return Buffer.concat(secret.map((item, index) => {
        const value = Number(item.slice(0, 5));
        const checksum = Number(item.slice(5));
        assert.strictEqual(item.length, 6);
        assert.strictEqual(value * (index * 2 + 1) % 9 === checksum, true);
        const hex = ('0000' + value.toString(16)).slice(-4);
        return Buffer.from(hex, 'hex');
    }));
}
export function walletFromNumbers(numbers:string):Wallet {
    numbers = numbers.replace(/[^0-9]/g, '');
    if (numbers.length !== 48) {
        throw new Error('wrong length');
    }
    let secret:Array<string> = Array.apply(null, Array(8)).map((a:any, i:any) => {
        return numbers.slice(i * 6, (i + 1) * 6)
    });
    assert.strictEqual(secret.length, 8);
    secret.forEach((r, i) => {
        assert.strictEqual(r.length, 6);
    });
    const entropy = this.secretToEntropy(secret);
    return Wallet.fromSeed(keypairs.generateSeed({entropy: entropy}))
}