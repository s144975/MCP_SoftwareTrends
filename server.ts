import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import express from 'express';
import { z } from 'zod';

// Quotes lijst
const quotes = [
  "May the Force be with you.",
  "I'm gonna make him an offer he can't refuse.",
  "Here's looking at you, kid.",
  "You can't handle the truth!",
  "Life finds a way.",
  "Houston, we have a problem.",
  "Why so serious?",
  "I'll be back.",
  "To infinity and beyond!",
  "Just keep swimming."
];

// Create an MCP server
const server = new McpServer({
    name: 'demo-server',
    version: '1.0.0'
});

// Add an addition tool
server.registerTool(
    'add',
    {
        title: 'Addition Tool',
        description: 'Add two numbers',
        inputSchema: { a: z.number(), b: z.number() },
        outputSchema: { result: z.number() }
    },
    async ({ a, b }) => {
        const output = { result: a + b };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output
        };
    }
);

server.registerResource(
  'quote',
  new ResourceTemplate('quote://5', { list: undefined }),
  {
    title: 'Quote Resource',
    description: 'Returns a specific inspirational quote by ID',
  },
  async (uri, variables: Variables) => {
    const idVar = variables.id;
    const idStr = Array.isArray(idVar) ? idVar[0] : idVar;

    if (!idStr) {
      throw new Error("Missing 'id' parameter");
    }

    const index = parseInt(idStr) - 1;
    const quote = quotes[index % quotes.length];

    return {
      contents: [
        {
          uri: uri.href,
          text: quote,
        },
      ],
    };
  }
);

// Set up Express and HTTP transport
const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    res.on('close', () => {
        transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
    console.log(`Demo MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
    console.error('Server error:', error);
    process.exit(1);
});
