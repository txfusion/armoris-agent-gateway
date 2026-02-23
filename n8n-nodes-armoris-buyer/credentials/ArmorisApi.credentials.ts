import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class ArmorisApi implements ICredentialType {
    name = 'armorisApi';
    displayName = 'Armoris Agent API';
    // Docs for n8n credentials: https://docs.n8n.io/integrations/creating-nodes/build/credentials/
    documentationUrl = 'https://github.com/txfusion/grammar-agent-pay';

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
            default: 31337,
            required: true,
            description: 'Chain ID of the network (e.g., 31337 for local hardhat, 324705682 for Skale Testnet).',
        },
        {
            displayName: 'RPC URL',
            name: 'rpcUrl',
            type: 'string',
            default: 'http://localhost:8545',
            required: true,
            description: 'RPC Endpoint for the network.',
        },
        {
            displayName: 'Token Address (Mock USDC)',
            name: 'tokenAddress',
            type: 'string',
            default: '',
            required: false,
            description: 'ERC20 contract address of the configured token (e.g. USDC).',
        },
        {
            displayName: 'Facilitator Address',
            name: 'facilitatorAddress',
            type: 'string',
            default: '',
            required: false,
            description: 'Address of the Agent Gateway Facilitator contract to approve.',
        },
    ];
}
