import {EventEmitter} from "./EventEmitter";
import * as xrpl from "xrpl";
import {delay, publicServers} from "./Utils";
import {ClientActions} from "./ClientActions";
import {SubscribesData} from "./Types";
import {TransactionStream} from "xrpl/dist/npm/models/methods";

export class Client {
    public events = new EventEmitter();
    public xrplClient?:xrpl.Client;
    private clientData:{states:any,server:string} = {
        states: {
            enabled: false,
            connecting: false,
            lastConnStatus: false
        },
        server:"wss://s2.ripple.com/",
    }
    private subscribes:SubscribesData = {
        streams: [],
        accounts: [],
        accounts_proposed: [],
        books: []
    };
    public actions:ClientActions = new ClientActions(this,this.subscribes);
    constructor() {
        this.events.on('tick',async ()=>{
            const isConnected = this.isConnected();
            if(this.clientData.states.lastConnStatus!=isConnected) {
                this.events.emit('connection',isConnected);
                this.clientData.states.lastConnStatus=isConnected;
            }
            const clientData = this.clientData;
            const states = clientData.states;
            if(isConnected || !states.enabled) return;
            await this.checkConnection();
        });
    }

    public async create(server:string=publicServers.Testnet) {
        this.clientData.server=server;
        this.clientData.states.enabled=true;
        await this.checkConnection(true);
        this.events.emit('create');
    }
    public async close() {
        const clientData = this.clientData;
        clientData.states.enabled=false;
        this.events.emit('close');
        await this.disconnect();
    }
    private async connect(server:string) {
        try {
            console.log(`connect to [${server}]`);
            this.xrplClient = new xrpl.Client(server);
            this.xrplClient.on("error", (...err)=>{
                console.error('xrpl error',err)
            });
            this.xrplClient.on("transaction",(tx: TransactionStream)=>{
                this.events.emit("transaction",tx);
            });
            await this.xrplClient.connect();
            await this.actions.subscribe();
        } catch (e) {
            console.error('connection error',e);
        }
    }
    private async disconnect() {
        try {
            if(this.isConnected())
                await this.xrplClient.disconnect();
        } catch (e) {
            console.error('disconnect error',e);
        }
    }
    private async checkConnection(force?:boolean) {
        const clientData = this.clientData;
        const states = clientData.states;
        if(states.connecting) return;
        states.connecting=true;
        if(force) await this.disconnect();
        if(states.enabled && !this.isConnected()) {
            await this.connect(clientData.server);
        }
        states.connecting=false;
    }
    public isConnected() {
        return !!this.xrplClient?.isConnected();
    }
    public async awaitConnection() {
        while (true) {
            if(this.isConnected()) return;
            await delay();
        }
    }
}