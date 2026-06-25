import express, { Router, Request, Response } from "express";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const router: Router = express.Router();

// ─── Gaode MCP client singleton ───────────────────────────────────────────────
let mcpClient: MultiServerMCPClient | null = null;
let mcpTools: any[] = [];
let mcpReady = false;

async function getMcpTools(): Promise<any[]> {
  if (mcpReady) return mcpTools;

  const amapKey = process.env.AMAP_MAPS_API_KEY;
  if (!amapKey) {
    console.warn("[AI] AMAP_MAPS_API_KEY not set — Gaode MCP disabled");
    mcpReady = true;
    return [];
  }

  try {
    mcpClient = new MultiServerMCPClient({
      "amap-maps": {
        transport: "stdio",
        command: "npx",
        args: ["-y", "@amap/amap-maps-mcp-server"],
        env: { AMAP_MAPS_API_KEY: amapKey },
      } as any,
    });

    await mcpClient.initializeConnections();
    mcpTools = await mcpClient.getTools();
    console.log(
      `[AI] Gaode MCP ready, ${mcpTools.length} tools:`,
      mcpTools.map((t: any) => t.name)
    );
  } catch (err) {
    console.error("[AI] Gaode MCP init failed:", err);
  }

  mcpReady = true;
  return mcpTools;
}

// ─── Route submission schema ───────────────────────────────────────────────────
const placeSchema = z.object({
  name: z.string().describe("Full searchable place name in local language"),
  type: z
    .enum(["scenic", "restaurant", "hotel", "shopping", "transport", "nature"])
    .describe("Place category"),
  description: z.string().describe("Brief description of this place"),
  lng: z.number().describe("Longitude obtained from Gaode geocoding tool"),
  lat: z.number().describe("Latitude obtained from Gaode geocoding tool"),
});

const routeSchema = z.object({
  days: z.array(
    z.object({
      dayText: z
        .string()
        .describe("Day label, e.g. 'Day 1 - 故宫天安门' or 'Day 1 - Forbidden City'"),
      description: z.string().describe("Theme or summary of this day"),
      places: z
        .array(placeSchema)
        .describe("Ordered list of places to visit this day"),
    })
  ),
});

// ─── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert travel planning assistant for PlanPinGo.
Help users design detailed, practical travel itineraries with real, specific places.

When a user asks for a travel route or itinerary:
1. Use the available Gaode Maps tools (maps_geocode, maps_search_detail, or similar) to find real places and obtain accurate coordinates.
2. Design a logical daily itinerary with 3–6 places per day.
3. Call submit_travel_route with the complete structured plan including coordinates from step 1.
4. After calling submit_travel_route, write a warm, friendly summary describing the highlights.

Important rules:
- Coordinates MUST come from Gaode Maps tools, not estimated values.
- Use full, searchable place names (e.g. "故宫博物院" not "故宫").
- If the user asks to refine or adjust the route, update and re-submit.

When the user is just chatting or asking questions (not requesting a route), respond naturally without tools.`;

// ─── GCJ-02 → WGS-84 coordinate conversion ────────────────────────────────────
// Gaode Maps uses GCJ-02 (China standard); Mapbox uses WGS-84 (GPS).
// This conversion is a no-op for coordinates outside China.
function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}
function transformLat(x: number, y: number): number {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  r += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y / 30) * Math.PI)) * 2) / 3;
  return r;
}
function transformLng(x: number, y: number): number {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3;
  r += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3;
  return r;
}
function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];
  const a = 6378245.0, ee = 0.00669342162296594323;
  let dLat = transformLat(lng - 105, lat - 35);
  let dLng = transformLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return [lng * 2 - (lng + dLng), lat * 2 - (lat + dLat)];
}

// ─── Tool-calling agent loop ───────────────────────────────────────────────────
async function runAgentLoop(
  model: ChatOpenAI,
  messages: BaseMessage[],
  allTools: any[]
): Promise<{ reply: string; routeSuggestion: any | null }> {
  let capturedRoute: any = null;

  // Request-scoped submit_travel_route tool
  const submitRouteTool = tool(
    async (input: z.infer<typeof routeSchema>) => {
      // Convert GCJ-02 → WGS-84 so Mapbox renders pins at correct positions
      capturedRoute = {
        ...input,
        days: input.days.map((day) => ({
          ...day,
          places: day.places.map((place) => {
            const [wgsLng, wgsLat] = gcj02ToWgs84(place.lng, place.lat);
            return { ...place, lng: wgsLng, lat: wgsLat };
          }),
        })),
      };
      return "Route saved. Now write your friendly itinerary summary to the user.";
    },
    {
      name: "submit_travel_route",
      description:
        "Submit the final structured travel plan. Call this AFTER geocoding each place with Gaode tools to get accurate coordinates.",
      schema: routeSchema,
    }
  );

  const tools = [...allTools, submitRouteTool];
  const modelWithTools = (model as any).bindTools(tools);

  const loopMessages = [...messages];
  const MAX_ITER = 12;

  for (let i = 0; i < MAX_ITER; i++) {
    const response = await modelWithTools.invoke(loopMessages);
    loopMessages.push(response);

    const toolCalls: any[] = response.tool_calls ?? [];

    // No more tool calls → final answer
    if (toolCalls.length === 0) {
      return {
        reply: typeof response.content === "string" ? response.content : JSON.stringify(response.content),
        routeSuggestion: capturedRoute,
      };
    }

    // Execute each tool call
    for (const tc of toolCalls) {
      const matched = tools.find((t: any) => t.name === tc.name);
      let result: string;

      if (matched) {
        try {
          const raw = await matched.invoke(tc.args);
          result = typeof raw === "string" ? raw : JSON.stringify(raw);
        } catch (err: any) {
          result = `Tool error: ${err?.message ?? err}`;
        }
      } else {
        result = `Unknown tool: ${tc.name}`;
      }

      loopMessages.push(
        new ToolMessage({
          content: result,
          tool_call_id: tc.id ?? `call_${i}`,
          name: tc.name,
        })
      );
    }
  }

  // Fallback: ask for a final answer without tools
  const finalResp = await model.invoke(loopMessages);
  return {
    reply:
      typeof finalResp.content === "string"
        ? finalResp.content
        : JSON.stringify(finalResp.content),
    routeSuggestion: capturedRoute,
  };
}

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(503).json({
        error: "AI service not configured",
        detail: "OPENAI_API_KEY is missing in backend .env",
      });
      return;
    }

    const model = new ChatOpenAI({
      modelName: process.env.AI_MODEL || "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
      configuration: process.env.OPENAI_BASE_URL
        ? { baseURL: process.env.OPENAI_BASE_URL }
        : undefined,
    });

    // Build message history
    const langchainMessages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.map((m) =>
        m.role === "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content)
      ),
    ];

    // Get Gaode MCP tools (cached after first call)
    const gaodeTools = await getMcpTools();

    const { reply, routeSuggestion } = await runAgentLoop(
      model,
      langchainMessages,
      gaodeTools
    );

    res.json({ reply, routeSuggestion });
  } catch (error: any) {
    console.error("[AI] chat error:", error);
    res.status(500).json({
      error: "AI service error",
      detail: error?.message ?? "Unknown error",
    });
  }
});

export default router;
