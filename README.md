# VidNavigator for n8n

VidNavigator MCP integration for n8n. Search, analyze, and transcribe videos directly in your workflows, plus run any VidNavigator MCP tool dynamically.

Homepage: https://vidnavigator.com

## Installation

In n8n:
- Settings → Community Nodes → Install → enter `n8n-nodes-vidnavigator`.

Self-hosted via Docker (example mount):
- Ensure the package is available in the container under `/root/.n8n/custom` or install from the UI above.

## Credentials

App: VidNavigator API

Fields:
- Base URL: `https://api.vidnavigator.com/mcp/`
- Token: your VidNavigator API key (Bearer token)

How to get an API key:
1) Go to https://vidnavigator.com and sign up
2) Click the user icon → DevTools
3) Create an API key. Copy it

## Operations

- Analyze Video: Summarize or answer a question about a YouTube video
- Get Video Transcript: Return the transcript for a video
- Answer Follow-Up Question: Ask a follow-up question about a video
- Transcribe Video (Non-YouTube): Transcribe a non-YouTube video URL
- Search Videos: Find relevant videos with filters
- Run MCP Tool (Dynamic): Select any tool from VidNavigator MCP (loaded via tools/list) and provide JSON arguments
- Custom Request: Make a custom HTTP request to the MCP endpoint

Notes:
- Dynamic tool discovery uses the MCP `tools/list` endpoint and calls tools via `tools/call`.
- Arguments for dynamic tools are provided as a JSON object.

## Examples

Run MCP Tool (Dynamic):
- Tool: `analyze_video`
- Arguments:
```
{"video_url":"https://www.youtube.com/watch?v=ImT_k6EcMks","analysis_type":"summary"}
```

Search Videos:
- Query: `n8n tutorial`
- Optional: Start Year, End Year, Focus, Max Results

Analyze Video:
- Video URL: `https://www.youtube.com/watch?v=ImT_k6EcMks`
- Analysis Type: `summary` or `question`
- Question (only if Analysis Type = question)

## Compatibility

- Requires Node.js 20+
- Works with recent n8n versions (1.x)

If you plan to use this node as a Tool in n8n AI Agents, ensure your instance allows tool usage for community packages. For some setups this may require an environment flag such as `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`.

## Local development

Clone, install, build:
```
npm install
npm run build
```

For a Docker-based n8n dev setup, ensure the built `dist/` is mounted into `/root/.n8n/custom/n8n-nodes-vidnavigator` and start n8n.

## Publish

1) Lint and build:
```
npm run lint
npm run build
```
2) Publish to npm:
```
npm publish
```
3) Submit to the n8n Community Nodes for marketplace listing.

## License

MIT
