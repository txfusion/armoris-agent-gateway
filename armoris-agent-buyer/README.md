# armoris-agent-buyer

Core SDK for AI Agents to purchase products from WooCommerce stores using the [x402 payment protocol](https://www.x402.org/).

[![npm](https://img.shields.io/npm/v/armoris-agent-buyer)](https://www.npmjs.com/package/armoris-agent-buyer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install armoris-agent-buyer
```

## Quick Start

```typescript
import { discoverStore, buyFromStore } from 'armoris-agent-buyer';

// 1. Auto-discover store config from a product page URL
const store = await discoverStore('https://my-store.com/product/sneakers');

// 2. Purchase the item
const result = await buyFromStore({
  gatewayUrl: store.gatewayUrl,
  storeId: store.storeId,
  privateKey: '0x...',       // Agent's EVM wallet
  networkId: 31337,          // 31337 (local) or 324705682 (Skale Testnet)
  rpcUrl: 'http://localhost:8545',
}, {
  items: [{ sku: 'sneakers-001', quantity: 1 }],
  customerDetails: {
    email: 'agent@armoris.ai',
    firstName: 'AI',
    lastName: 'Agent',
    address1: '123 Cloud St',
    city: 'Serverville',
    country: 'US',
    state: 'CA',
    postcode: '90210',
    phone: '555-0123',
  },
});

console.log('Order ID:', result.orderId);
```

## API

### `discoverStore(shopUrl, fetchContextData?)`

Scrapes a WooCommerce product/shop page for `<meta name="x402:...">` tags and returns the store configuration.

| Parameter | Type | Description |
|-----------|------|-------------|
| `shopUrl` | `string` | URL of the WooCommerce product or shop page |
| `fetchContextData` | `boolean` | Whether to also fetch extended context (default: `true`) |

**Returns:** `StoreContext` — `{ storeId, gatewayUrl, contextUrl, contextData? }`

### `buyFromStore(config, request)`

Executes the full purchase flow: quote → x402 payment signature → order submission.

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.gatewayUrl` | `string` | Armoris Gateway URL |
| `config.storeId` | `string` | Store identifier |
| `config.privateKey` | `0x${string}` | Agent's EVM private key |
| `config.networkId` | `number` | Chain ID |
| `config.rpcUrl` | `string` | RPC endpoint URL |
| `config.tokenAddress?` | `0x${string}` | ERC-20 token address (optional) |
| `config.facilitatorAddress?` | `0x${string}` | Facilitator contract address (optional) |
| `request.items` | `Array` | `[{ sku: string, quantity: number }]` |
| `request.customerDetails` | `object` | Billing/shipping details |

**Returns:** `PurchaseResult` — `{ success, orderId?, receipt?, error? }`

## Supported Frameworks

Works in any Node.js/TypeScript environment:

- **n8n** — via the companion [`n8n-nodes-armoris-buyer`](../n8n-nodes-armoris-buyer) node or Code Node
- **LangChain** — wrap `buyFromStore` as a custom `Tool`
- **AutoGPT / CrewAI** — import as a standard npm package
- **Custom scripts** — see `src/example.ts`

## Environment Variables

Copy `.env.example` and configure:

```bash
AGENT_PRIVATE_KEY=0x...
NETWORK_ID=31337
RPC_URL=http://localhost:8545
MOCK_USDC_ADDRESS=0x...
FACILITATOR_ADDRESS=0x...
```

## License

MIT © [txFusion](https://txfusion.io)
