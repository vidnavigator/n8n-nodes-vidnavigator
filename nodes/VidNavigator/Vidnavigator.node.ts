import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class VidNavigator implements INodeType {
	methods = {
		loadOptions: {
			async getMcpTools(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				// Build absolute URL from credential to avoid relying on requestDefaults in loadOptions
				const creds = (await this.getCredentials('vidNavigatorApi')) as { baseUrl?: string };
				const baseUrl = (creds?.baseUrl ?? '').trim();
				const fullUrl = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/` : '';

				const requestOptions: any = {
					method: 'POST',
					url: fullUrl,
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/list',
						params: {},
					},
				};

				try {
					const responseData: any = await this.helpers.requestWithAuthentication.call(
						this,
						'vidNavigatorApi',
						requestOptions,
					);

					const tools = responseData?.result?.tools ?? responseData?.result ?? [];
					const options: INodePropertyOptions[] = [];
					for (const t of Array.isArray(tools) ? tools : []) {
						const name: string = t?.name ?? '';
						if (!name) continue;
						const description: string | undefined = t?.description ?? t?.desc ?? undefined;
						options.push({
							name: description ? `${name} — ${String(description).slice(0, 80)}` : name,
							value: name,
							description,
						});
					}
					return options.length > 0 ? options : [{ name: 'No Tools Available', value: '' }];
				} catch {
					return [{ name: 'No Tools Available', value: '' }];
				}
			},
		},
	};
	description: INodeTypeDescription = {
		displayName: 'VidNavigator',
		name: 'vidnavigator',
		group: ['transform'],
		version: 1,
			description: 'VidNavigator integration',
			defaults: {
				name: 'VidNavigator',
			},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		icon: 'file:vidnavigator.svg',
		credentials: [
			{
				name: 'vidNavigatorApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Analyze Video', value: 'analyzeVideo', action: 'Analyze a video' },
					{ name: 'Answer Follow-Up Question', value: 'answerFollowup', action: 'Answer a follow up question' },
					{ name: 'Custom Request', value: 'custom', action: 'Make a custom HTTP request' },
					{ name: 'Get Video Transcript', value: 'getTranscript', action: 'Get video transcript' },
					{ name: 'Run MCP Tool (Dynamic)', value: 'callTool', action: 'Run a tool from vid navigator mcp' },
					{ name: 'Search Videos', value: 'searchVideos', action: 'Search videos' },
					{ name: 'Transcribe Video (Non-YouTube)', value: 'transcribeVideo', action: 'Transcribe a video' },
				],
				default: 'searchVideos',
			},

			// Search Videos
			{
				displayName: 'Query',
				name: 'queryText',
				type: 'string',
				default: '',
				required: true,
				description: 'Search query',
				displayOptions: { show: { operation: ['searchVideos'] } },
			},
			{
				displayName: 'Start Year',
				name: 'startYear',
				type: 'number',
				default: 0,
				description: 'Optional start year filter',
				displayOptions: { show: { operation: ['searchVideos'] } },
			},
			{
				displayName: 'End Year',
				name: 'endYear',
				type: 'number',
				default: 0,
				description: 'Optional end year filter',
				displayOptions: { show: { operation: ['searchVideos'] } },
			},
			{
				displayName: 'Focus',
				name: 'focus',
				type: 'options',
				options: [
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Popularity', value: 'popularity' },
					{ name: 'Brevity', value: 'brevity' },
				],
				default: 'relevance',
				displayOptions: { show: { operation: ['searchVideos'] } },
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				default: 5,
				description: 'Maximum number of results to return',
				displayOptions: { show: { operation: ['searchVideos'] } },
			},

			// Analyze Video
			{
				displayName: 'Video URL',
				name: 'videoUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'YouTube video URL',
				displayOptions: { show: { operation: ['analyzeVideo'] } },
			},
			{
				displayName: 'Analysis Type',
				name: 'analysisType',
				type: 'options',
				options: [
					{ name: 'Summary', value: 'summary' },
					{ name: 'Question', value: 'question' },
				],
				default: 'summary',
				displayOptions: { show: { operation: ['analyzeVideo'] } },
			},
			{
				displayName: 'Question',
				name: 'analysisQuestion',
				type: 'string',
				default: '',
				description: 'If analysis type is question, provide the question',
				displayOptions: { show: { operation: ['analyzeVideo'], analysisType: ['question'] } },
			},

			// Get Transcript
			{
				displayName: 'Video URL',
				name: 'videoUrlTranscript',
				type: 'string',
				default: '',
				required: true,
				description: 'Video URL to fetch transcript for',
				displayOptions: { show: { operation: ['getTranscript'] } },
			},

			// Answer Follow-up
			{
				displayName: 'Video URL',
				name: 'videoUrlFollow',
				type: 'string',
				default: '',
				required: true,
				description: 'Video URL to answer a follow-up question about',
				displayOptions: { show: { operation: ['answerFollowup'] } },
			},
			{
				displayName: 'Question',
				name: 'followQuestion',
				type: 'string',
				default: '',
				required: true,
				description: 'Follow-up question',
				displayOptions: { show: { operation: ['answerFollowup'] } },
			},

			// Run MCP Tool (dynamic)
			{
				displayName: 'Tool Name or ID',
				name: 'toolName',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getMcpTools' },
				default: '',
				required: true,
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: { show: { operation: ['callTool'] } },
			},
			{
				displayName: 'Arguments',
				name: 'toolArgs',
				type: 'json',
				default: '{}',
				description: 'JSON object with arguments for the tool',
				displayOptions: { show: { operation: ['callTool'] } },
			},

			// Transcribe Video (non-YouTube)
			{
				displayName: 'Video URL',
				name: 'videoUrlTranscribe',
				type: 'string',
				default: '',
				required: true,
				description: 'Non-YouTube video URL to transcribe',
				displayOptions: { show: { operation: ['transcribeVideo'] } },
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'en',
				description: 'ISO2 language code (e.g. en, fr)',
				displayOptions: { show: { operation: ['transcribeVideo'] } },
			},

			// Custom request fields
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
				],
				default: 'POST',
				displayOptions: { show: { operation: ['custom'] } },
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '/',
				description: 'Relative path under the MCP base URL, e.g. "/search_videos"',
				displayOptions: { show: { operation: ['custom'] } },
			},
			{
				displayName: 'Query Parameters',
				name: 'query',
				type: 'fixedCollection',
				placeholder: 'Add Query Parameter',
				default: {},
				typeOptions: { multipleValues: true },
				displayOptions: { show: { operation: ['custom'] } },
				options: [
					{
						name: 'parameters',
						displayName: 'Parameters',
						values: [
							{ displayName: 'Key', name: 'key', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'Body',
				name: 'bodyJson',
				type: 'json',
				default: '',
				description: 'JSON body for POST requests',
				displayOptions: { show: { operation: ['custom'], method: ['POST'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		// Helper to join base URL from credentials with a relative path safely
		const joinUrl = (baseUrl: string, maybePath: string): string => {
			const base = (baseUrl || '').replace(/\/+$/, '');
			const rel = (maybePath || '').replace(/^\/+/, '');
			return rel ? `${base}/${rel}` : `${base}/`;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const creds = (await this.getCredentials('vidNavigatorApi')) as { baseUrl?: string };
			const baseUrl = (creds?.baseUrl ?? '').trim();
			const operation = this.getNodeParameter('operation', itemIndex) as
				| 'custom'
				| 'searchVideos'
				| 'analyzeVideo'
				| 'getTranscript'
				| 'answerFollowup'
				| 'transcribeVideo'
				| 'callTool';

			let responseData: any;

			if (operation === 'custom') {
				const method = this.getNodeParameter('method', itemIndex) as 'GET' | 'POST';
				const path = this.getNodeParameter('path', itemIndex) as string;
				const queryCollection = this.getNodeParameter('query', itemIndex, {}) as {
					parameters?: Array<{ key: string; value: string }>;
				};
				const bodyJson = (method === 'POST'
					? (this.getNodeParameter('bodyJson', itemIndex, '') as string | object)
					: undefined) as string | object | undefined;

				const qs: Record<string, string> = {};
				for (const pair of queryCollection.parameters ?? []) {
					if (pair.key) qs[pair.key] = pair.value ?? '';
				}

				const requestOptions: any = {
					method,
					url: joinUrl(baseUrl, path),
					qs,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
					json: true,
				};

				if (method === 'POST' && bodyJson !== undefined && bodyJson !== '') {
					try {
						requestOptions.body = typeof bodyJson === 'string' ? JSON.parse(bodyJson) : bodyJson;
					} catch (e) {
						requestOptions.body = bodyJson;
					}
				}

				responseData = await this.helpers.requestWithAuthentication.call(
					this,
					'vidNavigatorApi',
					requestOptions,
				);
			} else if (operation === 'searchVideos') {
				const queryText = this.getNodeParameter('queryText', itemIndex) as string;
				const startYear = this.getNodeParameter('startYear', itemIndex, 0) as number;
				const endYear = this.getNodeParameter('endYear', itemIndex, 0) as number;
				const focus = this.getNodeParameter('focus', itemIndex, 'relevance') as string;
				const maxResults = this.getNodeParameter('maxResults', itemIndex, 5) as number;

				const args: Record<string, any> = { query: queryText };
				if (startYear && startYear > 0) args.start_year = startYear;
				if (endYear && endYear > 0) args.end_year = endYear;
				if (focus) args.focus = focus;
				if (maxResults) args.max_results = maxResults;

				const requestOptions: any = {
					method: 'POST',
					url: joinUrl(baseUrl, '/'),
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/call',
						params: { name: 'search_videos', arguments: args },
					},
				};

				responseData = await this.helpers.requestWithAuthentication.call(this, 'vidNavigatorApi', requestOptions);
			} else if (operation === 'analyzeVideo') {
				let videoUrl = this.getNodeParameter('videoUrl', itemIndex) as string;
				videoUrl = (videoUrl || '').trim().replace(/^@/, '');
				const analysisType = this.getNodeParameter('analysisType', itemIndex, 'summary') as string;
				const analysisQuestion = this.getNodeParameter('analysisQuestion', itemIndex, '') as string;

				const args: Record<string, any> = { video_url: videoUrl, analysis_type: analysisType };
				if (analysisType === 'question' && analysisQuestion) args.question = analysisQuestion;

				const requestOptions: any = {
					method: 'POST',
					url: joinUrl(baseUrl, '/'),
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/call',
						params: { name: 'analyze_video', arguments: args },
					},
				};

				responseData = await this.helpers.requestWithAuthentication.call(this, 'vidNavigatorApi', requestOptions);
			} else if (operation === 'getTranscript') {
				let videoUrl = this.getNodeParameter('videoUrlTranscript', itemIndex) as string;
				videoUrl = (videoUrl || '').trim().replace(/^@/, '');

				const requestOptions: any = {
					method: 'POST',
					url: joinUrl(baseUrl, '/'),
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/call',
						params: { name: 'get_video_transcript', arguments: { video_url: videoUrl } },
					},
				};

				responseData = await this.helpers.requestWithAuthentication.call(this, 'vidNavigatorApi', requestOptions);
			} else if (operation === 'answerFollowup') {
				let videoUrl = this.getNodeParameter('videoUrlFollow', itemIndex) as string;
				videoUrl = (videoUrl || '').trim().replace(/^@/, '');
				const followQuestion = this.getNodeParameter('followQuestion', itemIndex) as string;

				const requestOptions: any = {
					method: 'POST',
					url: joinUrl(baseUrl, '/'),
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/call',
						params: { name: 'answer_followup_question', arguments: { video_url: videoUrl, question: followQuestion } },
					},
				};

				responseData = await this.helpers.requestWithAuthentication.call(this, 'vidNavigatorApi', requestOptions);
			} else if (operation === 'transcribeVideo') {
				let videoUrl = this.getNodeParameter('videoUrlTranscribe', itemIndex) as string;
				videoUrl = (videoUrl || '').trim().replace(/^@/, '');
				const language = this.getNodeParameter('language', itemIndex, 'en') as string;

				const requestOptions: any = {
					method: 'POST',
					url: joinUrl(baseUrl, '/'),
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/call',
						params: { name: 'transcribe_video', arguments: { video_url: videoUrl, language } },
					},
				};

				responseData = await this.helpers.requestWithAuthentication.call(this, 'vidNavigatorApi', requestOptions);
			} else if (operation === 'callTool') {
				const toolName = this.getNodeParameter('toolName', itemIndex) as string;
				let args: any = this.getNodeParameter('toolArgs', itemIndex, {});
				if (typeof args === 'string' && args.trim() !== '') {
					try { args = JSON.parse(args); } catch {}
				}

				const requestOptions: any = {
					method: 'POST',
					url: joinUrl(baseUrl, '/'),
					headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
					json: true,
					body: {
						jsonrpc: '2.0',
						id: Date.now(),
						method: 'tools/call',
						params: { name: toolName, arguments: args ?? {} },
					},
				};

				responseData = await this.helpers.requestWithAuthentication.call(this, 'vidNavigatorApi', requestOptions);
			} else {
				responseData = { error: 'Unsupported operation' };
			}

			returnItems.push({ json: typeof responseData === 'object' ? responseData : { data: responseData } });
		}

		return [returnItems];
	}
}



export { VidNavigator as Vidnavigator };