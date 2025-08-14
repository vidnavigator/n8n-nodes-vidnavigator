import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VidNavigatorApi implements ICredentialType {
	name = 'vidNavigatorApi';
	displayName = 'VidNavigator API';

	documentationUrl = 'https://vidnavigator.com';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.vidnavigator.com/mcp',
			description: 'Base URL of the VidNavigator MCP HTTP endpoint',
		},
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			description: 'Bearer token for authenticating with VidNavigator MCP',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.token}}',
			},
		},
	};

		test: ICredentialTestRequest = {
			request: {
				baseURL: '={{$credentials?.baseUrl}}',
				url: '/',
				method: 'POST',
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/list',
					params: {},
				},
				json: true,
			},
		};
}


