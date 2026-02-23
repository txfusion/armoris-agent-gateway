export interface PurchaseItem {
    sku: string;
    quantity: number;
}

export interface CustomerDetails {
    email: string;
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    country: string;
    state: string;
    postcode: string;
    phone: string;
}

export interface BuyerConfig {
    /** The base URL of the Armoris Gateway (e.g. http://localhost:3001) */
    gatewayUrl: string;

    /** The ID of the store to purchase from */
    storeId: string;

    /** Private key (0x...) of the agent's EVM wallet to sign the x402 payment */
    privateKey: `0x${string}`;

    /** EVM Network ID (e.g., 31337 for local Hardhat, 324705682 for Skale Testnet) */
    networkId: number;

    /** 
     * The address of the Mock USDC or stablecoin. 
     * If not provided, it will try to use the network's native currency. 
     */
    tokenAddress?: `0x${string}`;

    /** The address of the Agent Gateway Facilitator (to approve spending) */
    facilitatorAddress?: `0x${string}`;

    /** Custom RPC URL for the network */
    rpcUrl: string;
}

export interface PurchaseRequest {
    items: PurchaseItem[];
    customerDetails: CustomerDetails;
}

export interface PurchaseResult {
    success: boolean;
    orderId?: string | number;
    receipt?: any;
    error?: string;
}
