import {EventEmitter} from 'events';
import {TransactionStream} from "xrpl/dist/npm/models/methods";
interface Events {
    'create': () => void; //create connection event
    'close': () => void; //close connection event
    'connection': (connected:boolean) => void; // connect/disconnect event
    'tick': () => void; // loop tick - up to 10 executions per second
    'transaction': (tx:TransactionStream) => void; // transaction event(from subscribe)
}
declare interface CoreEventEmitter {
    on<U extends keyof Events>(
        event: U, listener: Events[U]
    ): this;

    emit<U extends keyof Events>(
        event: U, ...args: Parameters<Events[U]>
    ): boolean;
}
class CoreEventEmitter extends EventEmitter {
    public tickInterval:any;
    constructor() {
        super();
        this.on('close',() => {
            clearInterval(this.tickInterval);
        });
        this.on('create',()=>{
            if(this.tickInterval) clearInterval(this.tickInterval);
            this.tickInterval = setInterval(()=>this.emit("tick"),100);
        });
    }
}
export {CoreEventEmitter as EventEmitter,Events};