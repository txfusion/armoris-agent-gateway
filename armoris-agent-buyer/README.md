# Armoris Agent Buyer

A framework-agnostic Javascript library that empowers AI Agents to natively purchase products from WooCommerce utilizing the x402 payment protocol.

Instead of writing complex Web3 viem providers and manually handling cryptographic signatures, this library gives your agent a simple `buyFromStore` function.

## Supported Frameworks
Any Node.js/TypeScript environment:
- **n8n** (Via the Custom Code node)
- **LangChain** (Easily wrapped in a generic `Tool`)
- **AutoGPT**
- **Custom Scripts**

## Installation
```bash
npm install armoris-agent-buyer viem @x402/core @x402/evm
```

## Using in n8n (Code Node)

To use this library inside an n8n workflow, you have two approaches:

### Option 1: Using the Code Node
1. Ensure the `armoris-agent-buyer` package is available to your n8n instance. 
   - If using Docker, map a volume or custom Dockerfile to `npm install` it globally or in `~/.n8n/custom/`.
   - Ensure the `NODE_FUNCTION_ALLOW_EXTERNAL` environment variable in n8n includes `armoris-agent-buyer`.
2. Add a **Code Node** to your workflow.
3. Use the following snippet to execute a purchase dynamically:

```javascript
const { buyFromStore, discoverStore } = require('armoris-agent-buyer');

// 1. Get Inputs from previous node (e.g. from an OpenAI Agent decision)
const shopUrl = $input.item.json.shopUrl; 
const sku = $input.item.json.sku;

// 2. Discover Store context dynamically
const storeContext = await discoverStore(shopUrl);

// 3. Configure Buyer (Preferably loading keys from n8n env/credentials)
const config = {
    gatewayUrl: storeContext.gatewayUrl,
    storeId: storeContext.storeId,
    privateKey: $env.AGENT_PRIVATE_KEY, // Loaded from n8n Environment or custom credentials
    networkId: parseInt($env.NETWORK_ID || "31337"),
    facilitatorAddress: $env.FACILITATOR_ADDRESS,
    tokenAddress: $env.MOCK_USDC_ADDRESS,
    rpcUrl: $env.RPC_URL || "http://localhost:8545"
};

const request = {
    items: [{ sku, quantity: 1 }],
    customerDetails: {
        email: 'agent@n8n.io',
        firstName: 'n8n',
        lastName: 'Agent',
        address1: '123 Node St',
        city: 'AutomationCity',
        country: 'US',
        state: 'CA',
        postcode: '90210',
        phone: '555-0123'
    }
};

// 4. Execute Purchase
const result = await buyFromStore(config, request);

if (result.success) {
    return { json: { status: "Success", orderId: result.orderId, receipt: result.receipt } };
} else {
    throw new Error(result.error);
}
```

### Option 2: Building a Custom Declarative n8n Node
For the best UX, you can build a custom `armoris-buyer-node` for n8n.
1. Create a declarative node using the `@n8n/n8n-nodes-starter`.
2. Define a **Credential Type** (e.g., `armorisAgentApi`) to securely store the Agent's Private Key, Network ID, and RPC URL.
3. Expose an input field for the `Shop URL` and the `Line Items (SKU)`.
4. In the `execute()` method, call `await discoverStore(shopUrl)` and then `buyFromStore(config, request)`, injecting the securely stored credentials into the `config` object.## Quick Start
```typescript
import { buyFromStore } from 'armoris-agent-buyer';

// This is what the AI Agent executes
const result = await buyFromStore({
    gatewayUrl: "http://localhost:3001",
    storeId: "store_123",
    privateKey: "0x...", // The Agent's EVM Wallet
    networkId: 31337      // 31337 (Local) or 324705682 (Skale Testnet)
}, {
    items: [{ sku: '1', quantity: 1 }],
    customerDetails: {
        email: 'agent@armoris.ai',
        firstName: 'Armoris',
        lastName: 'Agent',
        address1: '123 Cloud St',
        city: 'Serverville',
        country: 'US',
        state: 'CA',
        postcode: '90210',
        phone: '555-0123',
    }
});

console.log("Order Successful:", result.orderId);
```
