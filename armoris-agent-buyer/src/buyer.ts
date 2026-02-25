import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { hardhat } from "viem/chains";
import { x402Client } from "@x402/core/client";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";
import type { BuyerConfig, PurchaseRequest, PurchaseResult } from "./types.js";

export class ArmorisBuyer {
    private config: BuyerConfig;
    private evmSigner: ReturnType<typeof privateKeyToAccount>;
    private chain: any;
    private rpcUrl: string;

    constructor(config: BuyerConfig) {
        this.config = config;

        if (!config.privateKey.startsWith('0x')) {
            throw new Error("Private key must start with 0x");
        }
        this.evmSigner = privateKeyToAccount(config.privateKey);

        if (config.networkId === 324705682) { // Skale Testnet
            if (!config.rpcUrl) throw new Error("rpcUrl is required for Skale Testnet");
            this.chain = defineChain({
                id: 324705682,
                name: 'Skale Base Sepolia Testnet',
                network: 'skale-base-sepolia',
                nativeCurrency: { decimals: 18, name: 'sFUEL', symbol: 'sFUEL' },
                rpcUrls: {
                    default: { http: [config.rpcUrl] },
                    public: { http: [config.rpcUrl] },
                },
            });
            this.rpcUrl = config.rpcUrl;
        } else if (config.networkId === 1187947933) { // Skale Mainnet
            if (!config.rpcUrl) throw new Error("rpcUrl is required for SKALE Mainnet");
            this.chain = defineChain({
                id: 1187947933,
                name: 'SKALE Base Mainnet',
                network: 'skale-base',
                nativeCurrency: { decimals: 18, name: 'sFUEL', symbol: 'sFUEL' },
                rpcUrls: {
                    default: { http: [config.rpcUrl] },
                    public: { http: [config.rpcUrl] },
                },
            });
            this.rpcUrl = config.rpcUrl;
        } else {
            if (!config.networkId) throw new Error("networkId is required");
            if (!config.rpcUrl) throw new Error("rpcUrl is required");

            this.chain = { ...hardhat, id: config.networkId };
            this.rpcUrl = config.rpcUrl;
        }
    }

    /**
     * Approves the Facilitator to spend a specific ERC20 token (like Mock USDC)
     */
    async approveTokenSpend(amount: bigint = BigInt(1000000000)): Promise<string | undefined> {
        if (!this.config.tokenAddress || !this.config.facilitatorAddress) {
            // console.debug("[Armoris] Skip approval: tokenAddress or facilitatorAddress not provided.");
            return;
        }

        const walletClient = createWalletClient({
            account: this.evmSigner,
            chain: this.chain,
            transport: http(this.rpcUrl),
        });

        const publicClient = createPublicClient({
            chain: this.chain,
            transport: http(this.rpcUrl),
        });

        const approvalAbi = [{
            inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
        }] as const;

        try {
            // console.debug(`[Armoris] Approving ${this.config.tokenAddress} spend for ${this.config.facilitatorAddress}...`);
            const hash = await walletClient.writeContract({
                chain: this.chain,
                account: this.evmSigner,
                address: this.config.tokenAddress as `0x${string}`,
                abi: approvalAbi,
                functionName: 'approve',
                args: [this.config.facilitatorAddress as `0x${string}`, amount],
            });

            if (this.config.networkId !== 31337) {
                await publicClient.waitForTransactionReceipt({ hash });
            }
            return hash;
        } catch (error) {
            console.error("[Armoris] Token approval failed:", error);
            throw error; // Rethrow to let the agent know
        }
    }

    /**
     * Executes the full purchase flow against an Armoris Gateway
     */
    async buy(request: PurchaseRequest): Promise<PurchaseResult> {
        const contextUrl = `${this.config.gatewayUrl}/proxy/context/${this.config.storeId}`;

        try {
            // 1. Fetch Context for Dynamic Endpoints
            let contextResponse = await fetch(contextUrl);

            if (!contextResponse.ok) {
                return { success: false, error: `Failed to fetch store context (${contextResponse.status})` };
            }
            const contextData = await contextResponse.json();
            let quoteUrl = contextData.endpoints?.quote?.url;

            if (!quoteUrl) {
                return { success: false, error: `Quote endpoint not found in store context` };
            }

            if (process.env.N8N_HOST || process.env.DOCKER_HOST_ALIAS) {
                const alias = process.env.DOCKER_HOST_ALIAS || 'host.docker.internal';
                quoteUrl = quoteUrl.replace('localhost', alias).replace('127.0.0.1', alias);
            }

            // 2. Request Quote
            // console.debug(`[Armoris] Requesting quote from: ${quoteUrl}`);
            let response = await fetch(quoteUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: request.items }),
            });

            const responseText = await response.text();
            let responseData: any;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                return { success: false, error: `Invalid JSON received from quote: ${responseText}` };
            }

            // 2. Check for 402 Payment Required
            if (response.status === 402 || (response.status === 201 && responseData.x402Version)) {

                const paymentRequired = responseData as PaymentRequired;
                if (!paymentRequired.accepts || paymentRequired.accepts.length === 0) {
                    return { success: false, error: "402 received but no payment requirements found." }
                }

                // 3. Setup x402 Client
                const selectPayment = (_version: number, requirements: PaymentRequirements[]) => {
                    return requirements.find(r => r.network === `eip155:${this.chain.id}`) || requirements[0]!;
                };

                const publicClient = createPublicClient({
                    chain: this.chain,
                    transport: http(this.rpcUrl),
                });

                const clientSigner = toClientEvmSigner(this.evmSigner, publicClient as any);

                const client = new x402Client(selectPayment)
                    .register(`eip155:${this.chain.id}`, new ExactEvmScheme(clientSigner));

                // 4. Create Payment Payload & Signature
                // console.debug("[Armoris] Generating x402 payment signature...");
                const paymentPayload = await client.createPaymentPayload(paymentRequired);
                const paymentHeader = encodePaymentSignatureHeader(paymentPayload);

                // Use payment url from context endpoints if available, otherwise fallback to resource.url concat
                let paymentUrl = contextData.endpoints?.payment?.url || (this.config.gatewayUrl + paymentRequired.resource.url);

                if (process.env.N8N_HOST || process.env.DOCKER_HOST_ALIAS) {
                    const alias = process.env.DOCKER_HOST_ALIAS || 'host.docker.internal';
                    paymentUrl = paymentUrl.replace('localhost', alias).replace('127.0.0.1', alias);
                }

                // 5. Submit Final Order
                // console.debug(`[Armoris] Submitting final order to: ${paymentUrl}`);
                response = await fetch(paymentUrl, {
                    method: 'POST',
                    headers: {
                        "PAYMENT-SIGNATURE": paymentHeader,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        items: request.items,
                        orderDetails: request.customerDetails
                    }),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    return { success: false, error: `Order submission failed (${response.status}): ${errText}` };
                }

                const finalOrder = await response.json();
                return {
                    success: true,
                    orderId: finalOrder.id || finalOrder.orderId,
                    receipt: finalOrder
                };

            } else {
                return { success: false, error: `Unexpected quote response (${response.status}): ${JSON.stringify(responseData)}` };
            }

        } catch (error: any) {
            return { success: false, error: error.message || String(error) };
        }
    }
}

/**
 * Convenience function for simple one-off purchases
 */
export async function buyFromStore(config: BuyerConfig, request: PurchaseRequest): Promise<PurchaseResult> {
    const buyer = new ArmorisBuyer(config);
    return buyer.buy(request);
}

export interface StoreContext {
    gatewayUrl: string;
    storeId: string;
    contextUrl: string;
    contextData?: any;
}

/**
 * Discovers the store configuration by parsing a WooCommerce product or shop page URL.
 * Looks for <meta name="x402:..." /> tags injected by the armoris plugin.
 */
export async function discoverStore(shopUrl: string, fetchContextData: boolean = true): Promise<StoreContext> {
    // console.debug(`[Armoris] Discovering store configuration from: ${shopUrl}`);
    let response: Response;
    try {
        response = await fetch(shopUrl);
    } catch (e: any) {
        throw new Error(`Failed to fetch shop url (${shopUrl}): ${e.message}`);
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch shop url: ${shopUrl} ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Simple regex extraction for meta tags (avoiding heavy DOM parsers for broad compatibility)
    const storeIdMatch = html.match(/<meta[^>]*name=["']x402:store_id["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const gatewayUrlMatch = html.match(/<meta[^>]*name=["']x402:gateway_url["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const contextUrlMatch = html.match(/<meta[^>]*name=["']x402:context_url["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    if (!storeIdMatch || !gatewayUrlMatch) {
        throw new Error("x402 meta tags not found on the provided page. Is the plugin installed and active?");
    }

    let storeId = storeIdMatch[1]!;
    let gatewayUrl = gatewayUrlMatch[1]!;
    let contextUrl = contextUrlMatch ? contextUrlMatch[1]! : `${gatewayUrl}/proxy/context/${storeId}`;

    // Docker networking fix: If running inside n8n or a docker container, 
    // localhost will fail to resolve the host machine.
    // We rewrite localhost to host.docker.internal or a user-provided alias.
    if (process.env.N8N_HOST || process.env.DOCKER_HOST_ALIAS) {
        const alias = process.env.DOCKER_HOST_ALIAS || 'host.docker.internal';
        gatewayUrl = gatewayUrl.replace('localhost', alias).replace('127.0.0.1', alias);
        contextUrl = contextUrl.replace('localhost', alias).replace('127.0.0.1', alias);
    }

    const context: StoreContext = {
        storeId,
        gatewayUrl,
        contextUrl
    };

    if (fetchContextData) {
        try {
            // console.debug(`[Armoris] Fetching extended context from: ${contextUrl}`);
            const ctxResponse = await fetch(contextUrl);
            if (ctxResponse.ok) {
                context.contextData = await ctxResponse.json();
            } else {
                console.warn(`[Armoris] Failed to fetch context data (${ctxResponse.status}):`, await ctxResponse.text());
            }
        } catch (e) {
            console.warn("[Armoris] Exception while fetching context data:", e);
        }
    }

    return context;
}
