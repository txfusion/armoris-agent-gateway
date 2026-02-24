import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class ArmorisApi implements ICredentialType {
    name = 'armorisApi';
    displayName = 'Armoris Agent API';
    // Docs for n8n credentials: https://docs.n8n.io/integrations/creating-nodes/build/credentials/
    documentationUrl = 'https://github.com/txfusion/armoris-agent-gateway/';

    properties: INodeProperties[] = [
        {
            displayName: 'Agent EVM Private Key',
            name: 'privateKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            description: 'The Agent\'s private key starting with 0x used to sign x402 payments.',
        },
        {
            displayName: 'Network ID',
            name: 'networkId',
            type: 'number',
            default: 1187947933,
            required: true,
            description: 'Chain ID of the network.',
        },
        {
            displayName: 'RPC URL',
            name: 'rpcUrl',
            type: 'string',
            default: 'https://skale-base.skalenodes.com/v1/base',
            required: true,
            description: 'RPC Endpoint for the network.',
        },
        {
            displayName: 'Token Address',
            name: 'tokenAddress',
            type: 'string',
            default: '0x8DDb063c704c04370E7c6c0F8A2aC63f7f590F51',
            required: true,
            description: 'ERC20 contract address of the configured token (e.g. USDC).',
        },
        {
            displayName: 'Facilitator Address',
            name: 'facilitatorAddress',
            type: 'string',
            default: '0x9E758202196fbd20FACfA689FF850729C747fE67',
            required: true,
            description: 'Address of the Agent Gateway Facilitator contract to approve.',
        },
    ];
}
