import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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


// Maak MCP server
const server = new McpServer({
  name: 'random-quote-server',
  version: '1.0.0'
});

server.registerTool(
  'random-quote',
  {
    title: 'Random Quote Generator',
    description: 'Geeft een willekeurige inspirerende quote',
    inputSchema: {}, // geen input
    outputSchema: { quote: z.string() } // ZodRawShape object
  },
  async () => {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return {
      content: [{ type: 'text', text: quote }],
      structuredContent: { quote }
    };
  }
);


// Express setup
const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Random Quote Generator MCP-server running on http://localhost:${port}/mcp`);
});
