# n8n-nodes-armoris-buyer

Native [n8n](https://n8n.io/) community node for AI agents to purchase items from WooCommerce stores using the [x402 payment protocol](https://www.x402.org/).

[![npm](https://img.shields.io/npm/v/n8n-nodes-armoris-buyer)](https://www.npmjs.com/package/n8n-nodes-armoris-buyer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Auto-Discovery** — Provide a store URL, the node scrapes `<meta>` tags to find the Gateway URL and Store ID automatically
- **x402 Native** — Handles quote requests, EIP-712 payment signatures, and order submission under the hood
- **Secure Credentials** — Agent private keys are stored in n8n's encrypted credential vault
- **Dynamic Inputs** — All fields support n8n expressions, so upstream AI agents can inject URLs and items at runtime

## Installation

### Via n8n UI (Recommended)
1. Go to **Settings → Community Nodes → Install**
2. Search for `n8n-nodes-armoris-buyer`
3. Click **Install**

### Via Docker
```dockerfile
FROM n8nio/n8n:latest
USER root
COPY ./armoris-agent-buyer /usr/local/lib/n8n/armoris-agent-buyer
COPY ./n8n-nodes-armoris-buyer /usr/local/lib/n8n/n8n-nodes-armoris-buyer
RUN cd /usr/local/lib/n8n/armoris-agent-buyer && npm install --include=dev && npm run build
RUN cd /usr/local/lib/n8n/n8n-nodes-armoris-buyer && npm install --include=dev && npm run build
RUN mkdir -p /usr/local/lib/n8n/custom && cd /usr/local/lib/n8n/custom && npm init -y && \
    npm install /usr/local/lib/n8n/n8n-nodes-armoris-buyer /usr/local/lib/n8n/armoris-agent-buyer
USER node
```

Set `N8N_CUSTOM_EXTENSIONS=/usr/local/lib/n8n/custom` in your environment.

## Usage

### 1. Configure Credentials
1. In n8n, create a new **Armoris Agent API** credential
2. Enter the Agent's EVM private key (`0x...`)
3. Set the Network ID (e.g., `31337` for local, `324705682` for Skale Testnet)
4. Set the RPC URL

### 2. Add the Node
1. Add **Armoris Purchase Agent** to your workflow canvas
2. Select your credential
3. Set the **Shop URL** — the WooCommerce product page URL (e.g., `https://store.com/product/sneakers`)
4. Set the **Items** — JSON array of `[{ "sku": "product-123", "quantity": 1 }]`
5. Execute!

### Dynamic Inputs from AI Agents

All fields support n8n expressions. Wire an upstream AI agent's output directly:

- **Shop URL**: `{{ $json.shopUrl }}`
- **Items**: `{{ JSON.stringify($json.items) }}`

```
[AI Agent] → [IF: x402 supported?] → [Armoris Buyer] → [Response]
                                   ↘ [Stripe Node]    → [Response]
```

## Node Reference

| Field | Type | Description |
|-------|------|-------------|
| Shop URL | `string` | WooCommerce product or shop page URL |
| Items | `json` | Array of `{ sku, quantity }` objects |
| Customer Email | `string` | Buyer email (default: `agent@armoris.ai`) |
| Customer First Name | `string` | (default: `AI`) |
| Customer Last Name | `string` | (default: `Agent`) |

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```

## License

MIT © [txFusion](https://txfusion.io)
