# PreWeave

An optional service in-front of Arweave that allows users of the network to create and use decentralized IDs for their content, 
without commiting the data to the network for storage at generation time. 
At the PreWeave node operator’s discretion, data from this service can be replicated on other PreWeave nodes, 
and/or dispatched to the Arweave network for permanent storage.

## How to run

Requirements:
- Running instance of Postgres
- Setup .env based on .env.example

Install dependencies:
```yarn install```

Build node:
```yarn build```

Run node:
```yarn run```
