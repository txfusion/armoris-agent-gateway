import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';
import { buyFromStore, discoverStore, PurchaseRequest, BuyerConfig } from 'armoris-agent-buyer';

export class ArmorisBuyer implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Armoris Purchase Agent',
        name: 'armorisBuyer',
        icon: 'file:armoris.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Purchase items from a WooCommerce store using the Armoris x402 Gateway',
        defaults: {
            name: 'Armoris Buyer',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'armorisApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Shop URL',
                name: 'shopUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'The URL of the WooCommerce product or shop page (used to auto-discover configuration)',
            },
            {
                displayName: 'Items to Purchase',
                name: 'items',
                type: 'json',
                default: '[{ "sku": "1", "quantity": 1, "attributes": { "color": "black", "size": "42" } }]',
                required: true,
                description: 'JSON Array of items to buy (requires "sku", "quantity" and optional "attributes" object for variable products).',
            },
            {
                displayName: 'Customer Email',
                name: 'customerEmail',
                type: 'string',
                default: 'agent@armoris.ai',
                required: true,
            },
            {
                displayName: 'Customer First Name',
                name: 'customerFirstName',
                type: 'string',
                default: 'AI',
                required: true,
            },
            {
                displayName: 'Customer Last Name',
                name: 'customerLastName',
                type: 'string',
                default: 'Agent',
                required: true,
            },
            {
                displayName: 'Customer Address',
                name: 'customerAddress1',
                type: 'string',
                default: '123 Node St',
                required: true,
            },
            {
                displayName: 'Customer City',
                name: 'customerCity',
                type: 'string',
                default: 'Automation',
                required: true,
            },
            {
                displayName: 'Customer Country',
                name: 'customerCountry',
                type: 'string',
                default: 'US',
                required: true,
            },
            {
                displayName: 'Customer State',
                name: 'customerState',
                type: 'string',
                default: 'CA',
                required: true,
            },
            {
                displayName: 'Customer Postcode',
                name: 'customerPostcode',
                type: 'string',
                default: '90210',
                required: true,
            },
            {
                displayName: 'Customer Phone',
                name: 'customerPhone',
                type: 'string',
                default: '1234567890',
                required: true,
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const credentials = await this.getCredentials('armorisApi');
                const shopUrl = this.getNodeParameter('shopUrl', i) as string;
                const rawItems = this.getNodeParameter('items', i);
                let purchaseItems: { sku: string, quantity: number }[] = [];
                if (typeof rawItems === 'string') {
                    purchaseItems = JSON.parse(rawItems);
                } else if (Array.isArray(rawItems)) {
                    purchaseItems = rawItems as any[];
                } else {
                    throw new Error("Items must be a JSON array");
                }

                const customerDetails = {
                    email: this.getNodeParameter('customerEmail', i) as string,
                    firstName: this.getNodeParameter('customerFirstName', i) as string,
                    lastName: this.getNodeParameter('customerLastName', i) as string,
                    address1: this.getNodeParameter('customerAddress1', i) as string,
                    city: this.getNodeParameter('customerCity', i) as string,
                    country: this.getNodeParameter('customerCountry', i) as string,
                    state: this.getNodeParameter('customerState', i) as string,
                    postcode: this.getNodeParameter('customerPostcode', i) as string,
                    phone: this.getNodeParameter('customerPhone', i) as string
                };

                // 1. Discover Configuration
                const storeContext = await discoverStore(shopUrl);

                // 2. Build Buyer Config using securely stored credentials
                const config: BuyerConfig = {
                    gatewayUrl: storeContext.gatewayUrl,
                    storeId: storeContext.storeId,
                    privateKey: credentials.privateKey as `0x${string}`,
                    networkId: parseInt(credentials.networkId as string, 10),
                    rpcUrl: credentials.rpcUrl as string,
                    tokenAddress: credentials.tokenAddress ? credentials.tokenAddress as `0x${string}` : undefined,
                    facilitatorAddress: credentials.facilitatorAddress ? credentials.facilitatorAddress as `0x${string}` : undefined,
                };

                const request: PurchaseRequest = {
                    items: purchaseItems,
                    customerDetails,
                };

                // 3. Execute purchase
                const result = await buyFromStore(config, request);

                if (!result.success) {
                    throw new NodeOperationError(this.getNode(), `Purchase Failed: ${result.error}`, {
                        itemIndex: i,
                    });
                }

                returnData.push({
                    json: {
                        status: 'Success',
                        orderId: result.orderId,
                        receipt: result.receipt,
                        context: storeContext.contextData
                    },
                });

            } catch (error: any) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                    });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
            }
        }

        return [returnData];
    }
}
