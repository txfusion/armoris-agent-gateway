import { buyFromStore, discoverStore, type BuyerConfig, type PurchaseRequest } from './index.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const shopUrl = process.argv[2] || process.env.SHOP_URL;
    const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}`;

    if (!shopUrl || !privateKey) {
        console.error("Usage: ts-node src/example.ts <shopUrl>");
        console.error("Also ensure AGENT_PRIVATE_KEY is set in .env");
        process.exit(1);
    }

    console.log(`🤖 Agent initiating discovery for Shop at ${shopUrl}`);

    // 1. Discover Store Config
    const storeContext = await discoverStore(shopUrl);
    console.log(`✅ Discovered Store: ID=${storeContext.storeId}`);
    if (storeContext.contextData) {
        console.log(`🏪 Store Name: ${storeContext.contextData.store_name}`);
        console.log(`💱 Currency: ${storeContext.contextData.currency}`);
    }

    // 2. Setup Buyer Config
    const config: BuyerConfig = {
        gatewayUrl: storeContext.gatewayUrl,
        storeId: storeContext.storeId,
        privateKey: privateKey,
        networkId: parseInt(process.env.NETWORK_ID || "31337"),
        facilitatorAddress: process.env.FACILITATOR_ADDRESS as `0x${string}`,
        tokenAddress: process.env.MOCK_USDC_ADDRESS as `0x${string}`,
        rpcUrl: process.env.RPC_URL || "http://localhost:8545"
    };

    const request: PurchaseRequest = {
        items: [
            { sku: '1', quantity: 1 }
        ],
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
    };

    try {
        console.log("⏳ Calling armori-agent-buyer...");
        const result = await buyFromStore(config, request);

        if (result.success) {
            console.log(`✅ Success! Order created with ID: ${result.orderId}`);
        } else {
            console.error(`❌ Agent Purchase Failed: ${result.error}`);
        }

    } catch (e) {
        console.error("Agent Script Exception:", e);
    }
}

main();
