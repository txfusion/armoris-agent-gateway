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
                displayName: 'Customer details',
                name: 'customer',
                type: 'collection',
                placeholder: 'Add Details',
                default: JSON.stringify({
                    email: 'bob@email.com',
                    firstName: 'bob',
                    lastName: 'clark',
                    address1: '123 Node St',
                    city: 'LA',
                    country: 'US',
                    state: 'CA',
                    postcode: '90210',
                    phone: '1234567890'
                }),
                options: [
                    {
                        displayName: 'Email',
                        name: 'email',
                        type: 'string',
                        default: 'agent@armoris.ai',
                    },
                    {
                        displayName: 'First Name',
                        name: 'firstName',
                        type: 'string',
                        default: 'AI',
                    },
                    {
                        displayName: 'Last Name',
                        name: 'lastName',
                        type: 'string',
                        default: 'Agent',
                    },
                    {
                        displayName: 'Address 1',
                        name: 'address1',
                        type: 'string',
                        default: '123 Node St',
                    },
                    {
                        displayName: 'City',
                        name: 'city',
                        type: 'string',
                        default: 'Automation',
                    },
                    {
                        displayName: 'Country',
                        name: 'country',
                        type: 'string',
                        default: 'US',
                    },
                    {
                        displayName: 'State',
                        name: 'state',
                        type: 'string',
                        default: 'CA',
                    },
                    {
                        displayName: 'Postcode',
                        name: 'postcode',
                        type: 'string',
                        default: '90210',
                    },
                    {
                        displayName: 'Phone',
                        name: 'phone',
                        type: 'string',
                        default: '1234567890',
                    },
                ],
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
                let rawItems = this.getNodeParameter('items', i);
                let purchaseItems: { sku: string, quantity: number }[] = [];
                if (typeof rawItems === 'string') {
                    purchaseItems = JSON.parse(rawItems);
                } else if (Array.isArray(rawItems)) {
                    purchaseItems = rawItems as any[];
                } else {
                    throw new Error("Items must be a JSON array");
                }

                let customerProps = this.getNodeParameter('customer', i) as any;
                const customerDetails = {
                    email: customerProps.email,
                    firstName: customerProps.firstName,
                    lastName: customerProps.lastName,
                    address1: customerProps.address1,
                    city: customerProps.city,
                    country: customerProps.country,
                    state: customerProps.state,
                    postcode: customerProps.postcode,
                    phone: customerProps.phone
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
