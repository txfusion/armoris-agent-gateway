# Armoris Agent Gateway — Packages

Monorepo for the **Armoris Agent Gateway** client-side packages, enabling AI Agents to autonomously purchase products from e-commerce stores using the [x402 payment protocol](https://www.x402.org/).

## Packages

| Package | Description |
|---------|-------------|
| [`armoris-agent-buyer`](./armoris-agent-buyer) | Core SDK — provides `buyFromStore()` and `discoverStore()` for any Node.js/TypeScript agent |
| [`n8n-nodes-armoris-buyer`](./n8n-nodes-armoris-buyer) | Native n8n community node — drag-and-drop purchasing in n8n workflows |

## Quick Start

```bash
# Install the SDK
npm install armoris-agent-buyer

# Or install the n8n node via the n8n UI
# Settings → Community Nodes → Install → "n8n-nodes-armoris-buyer"
```

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI Agent   │────▶│  Armoris Gateway  │────▶│   WooCommerce   │
│  (SDK/n8n)   │     │   (x402 Proxy)    │     │     Store       │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                     │                        │
   1. discoverStore()   2. Quote + x402          3. Order Created
   4. buyFromStore()       Payment Proof            & Fulfilled
```

1. The agent visits a store URL and auto-discovers the gateway configuration from `<meta>` tags
2. The SDK requests a quote from the Armoris Gateway, which proxies to WooCommerce
3. Upon receiving a `402 Payment Required`, the SDK signs an x402 payment proof
4. The gateway verifies the payment on-chain and creates the order in WooCommerce

## Releasing

This repo uses a **two-step release workflow** via GitHub Actions:

1. **Prepare Release** — Go to Actions → `Prepare Release` → select bump type (`patch`/`minor`/`major`). This creates a version-bump PR.
2. **Publish Release** — Merging the PR into `main` automatically publishes to npm and creates a GitHub Release with `.tgz` assets.

> **Setup:** Add your npm token as a repository secret named `NPM_TOKEN` in Settings → Secrets → Actions.

## License

MIT © [txFusion](https://txfusion.io)
