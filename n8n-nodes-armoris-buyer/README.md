# n8n-nodes-armoris-buyer

This is a native [n8n](https://n8n.io/) custom node that enables AI agents to autonomously purchase items from Armoris x402-enabled stores (e.g., WooCommerce).

## Features
- **Auto-Discovery**: Provide the URL of the merchant's store, and the node automatically parses the `<meta>` tags to discover the Gateway URL, Store ID, and necessary Context Data to construct the transaction.
- **x402 Protocol Native**: Seamlessly leverages the `@x402/core` and `armoris-agent-buyer` SDKs to request quotes, perform EIP-712/Permit2 signatures, and submit the final payment proofs to the WooCommerce plugin.
- **Secure Credentials**: Uses n8n's encrypted credential vault to store the Agent's EVM Private Key, RPC URL, and Network IDs.

## Installation Methods

### Method 1: Installing into a Local n8n Instance (Quickstart)

If you are running n8n locally via `npm run start`:

1. Build this package:
   ```bash
   cd packages/n8n-nodes-armoris-buyer
   npm install
   npm run build
   ```
2. Navigate to your n8n custom extension directory (usually `~/.n8n/custom/`)
   ```bash
   mkdir -p ~/.n8n/custom
   cd ~/.n8n/custom
   ```
3. Initialize a basic `package.json` if it doesn't exist (`npm init -y`) and install the local package:
   ```bash
   npm install /path/to/txfusion/agent-gateway/packages/n8n-nodes-armoris-buyer
   ```
4. Restart your n8n instance.

### Method 2: Docker / Production Deployments
In a Docker environment, map this folder or `npm install` it directly in your `Dockerfile`:
```dockerfile
FROM n8nio/n8n:latest
USER root
# Example of installing from source inside Docker
COPY ./packages/n8n-nodes-armoris-buyer /usr/local/lib/n8n/n8n-nodes-armoris-buyer
RUN cd /usr/local/lib/n8n/n8n-nodes-armoris-buyer && npm install && npm run build
RUN cd /usr/local/lib/node_modules/n8n && npm install /usr/local/lib/n8n/n8n-nodes-armoris-buyer
USER node
```

## Setup & Usage

### 1. Configure Credentials
1. In n8n, create a new **Credential** and search for `Armoris Agent API`.
2. Input the Agent's EVM Private Key (`0x...`).
3. Set the Network ID (e.g., `31337` for Local Hardhat, `324705682` for Skale Testnet).
4. Save the credential.

### 2. Add the Node to a Workflow
1. Add the **Armoris Purchase Agent** node to your canvas.
2. Select your configured `Armoris Agent API` credential.
3. Pass the **Shop URL** dynamically from an expression or via an earlier node (e.g., `$json.shopUrl`).
4. Define the items you wish to purchase (`[{ "sku": "product_123", "quantity": 1 }]`).
5. Execute the Workflow!

## Development

To make changes to the node logic:
1. Run `npm run dev` to watch for local changes.
2. Restart n8n to ensure the updated javascript is reloaded.
