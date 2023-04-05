## anima-core

### Description
Anima project core module designed to simplify work with XRPL using **[xrpl.js](https://github.com/XRPLF/xrpl.js)**.

### Usage
``` js
const {Client} = require('anima-core');
(async ()=>{
    const client = new Client();
    
    // handle client events
    client.events.on("close",()=>{
        console.log('close event');
    });
    client.events.on("create",()=>{
        console.log('create event');
    });
    client.events.on("transaction",(tx)=>{
        console.log('transaction event:',tx);
    });
    
    // create connection
    await client.create();
    
    // get information about an account
    const accountInfo = await client.actions.getAccountInfo({address:"ranimaWirGXNxRAY12DfxpKsJ3ddZqdsLW"});
    console.log(accountInfo);

    // subscribe to server events
    await client.actions.subscribe({
        streams:["transactions"]
    });

    // close connection
    await client.close();
})();
```

### About Anima
[Anima](https://anima.pw)