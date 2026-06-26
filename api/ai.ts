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

const router: Router = express.Router();

// ─── SSE helper ───────────────────────────────────────────────────────────────
type SSEEmitter = (data: object) => void;

// ─── Gaode REST geocoding ──────────────────────────────────────────────────────
async function gaodeGeocode(
  address: string,
  amapKey: string
): Promise<{ lng: number; lat: number } | null> {
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(
      address
    )}&key=${amapKey}&output=JSON`;
    const resp = await fetch(url);
    const data = (await resp.json()) as any;
    if (data.status === "1" && data.geocodes?.length > 0) {
      const [lngStr, latStr] = (data.geocodes[0].location as string).split(",");
      return { lng: parseFloat(lngStr), lat: parseFloat(latStr) };
    }
  } catch (err) {
    console.error("[AI] Gaode geocode error:", err);
  }
  return null;
}

// ─── Gaode REST route planning ─────────────────────────────────────────────────
type TransportMode = "driving" | "walking" | "bicycling" | "transit";

async function gaodeDirection(
  origin: string,       // "lng,lat"
  destination: string,  // "lng,lat"
  mode: TransportMode,
  amapKey: string,
  city?: string
): Promise<{ distance: string; duration: string } | null> {
  try {
    let url: string;
    if (mode === "driving") {
      url = `https://restapi.amap.com/v3/direction/driving?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${amapKey}&output=JSON`;
    } else if (mode === "walking") {
      url = `https://restapi.amap.com/v3/direction/walking?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${amapKey}&output=JSON`;
    } else if (mode === "bicycling") {
      // v4 API — different response structure
      url = `https://restapi.amap.com/v4/direction/bicycling?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${amapKey}`;
    } else {
      // transit — city parameter required
      const cityParam = city ? `&city=${encodeURIComponent(city)}&cityd=${encodeURIComponent(city)}` : "";
      url = `https://restapi.amap.com/v3/direction/transit/integrated?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${amapKey}${cityParam}&output=JSON`;
    }

    const resp = await fetch(url);
    const data = (await resp.json()) as any;

    if (mode === "bicycling") {
      const path = data?.data?.paths?.[0];
      if (data.errcode === 0 && path) {
        const km = (path.distance / 1000).toFixed(1);
        const min = Math.ceil(path.duration / 60);
        return { distance: `${km}公里`, duration: `约${min}分钟` };
      }
    } else if (mode === "transit") {
      const transit = data?.route?.transits?.[0];
      if (data.status === "1" && transit) {
        const km = (parseInt(data.route.distance || "0") / 1000).toFixed(1);
        const min = Math.ceil(parseInt(transit.duration || "0") / 60);
        return { distance: `${km}公里`, duration: `约${min}分钟` };
      }
    } else {
      const path = data?.route?.paths?.[0];
      if (data.status === "1" && path) {
        const km = (parseInt(path.distance || "0") / 1000).toFixed(1);
        const min = Math.ceil(parseInt(path.duration || "0") / 60);
        return { distance: `${km}公里`, duration: `约${min}分钟` };
      }
    }
  } catch (err) {
    console.error("[AI] Gaode direction error:", err);
  }
  return null;
}

// ─── Route submission schema ───────────────────────────────────────────────────
const placeSchema = z.object({
  name: z.string().describe("地点完整名称，可被高德搜索到"),
  type: z
    .enum(["scenic", "restaurant", "hotel", "shopping", "transport", "nature"])
    .describe("地点类型"),
  description: z.string().describe("地点简介"),
  lng: z.number().describe("经度（GCJ-02，来自 gaode_geocode）"),
  lat: z.number().describe("纬度（GCJ-02，来自 gaode_geocode）"),
  travelTime: z
    .string()
    .optional()
    .describe("从上一个地点的预计行程，如'驾车约25分钟（15.3公里）'；第一个地点不填"),
});

const routeSchema = z.object({
  days: z.array(
    z.object({
      dayText: z.string().describe("日期标题，如'第1天 - 故宫天安门'"),
      description: z.string().describe("当天主题或概要"),
      places: z.array(placeSchema).describe("当天按顺序游览的地点列表"),
    })
  ),
});

// ─── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是 PlanPinGo 的专业旅行规划助手，帮助用户设计详细、实用的出行行程。

【第一步 — 确认交通方式】
如果用户没有明确说明交通方式，必须先停下来询问，不得直接开始规划：

> 请问您打算使用哪种交通方式出行？
> 🚗 驾车 / 🚶 步行 / 🚌 公共交通 / 🚲 骑行

等用户确认交通方式后，再进行后续步骤。

【第二步 — 规划地点列表（不调用任何工具）】
在脑海中确定每天的完整地点列表（每天 3～5 个为宜）。

【第三步 — 批量地理编码（一次响应中并行调用所有 gaode_geocode）】
对所有地点同时调用 gaode_geocode，严禁逐个调用。

【第四步 — 批量路径规划（一次响应中并行调用所有 gaode_direction）】
对每天每两个相邻地点之间，同时调用 gaode_direction 获取距离和时长。
- origin 和 destination 填写 gaode_geocode 返回的坐标，格式为 "经度,纬度"
- mode 使用用户确认的交通方式
- 公共交通需要填写 city 参数（如 "北京"、"成都"）

【第五步 — 提交路线并总结】
调用 submit_travel_route，坐标只能使用 gaode_geocode 返回的值，
travelTime 字段填写 gaode_direction 返回的时间和距离（第一个地点不填）。
提交后用温暖的 Markdown 格式为用户总结行程亮点。

注意事项：
- 地点名称必须完整可搜索（"故宫博物院"不是"故宫"，"成都双流国际机场"不是"成都机场"）
- 地理编码或路径规划失败时，尝试简化名称重试，或跳过该地点
- 调整路线时，只对变更的地点重新调用相关工具
- 闲聊或提问时正常回答，不调用工具

【图片攻略处理】
如果用户上传了截图（如小红书攻略、旅游攻略图片），请：
1. 仔细阅读图片中的所有文字，提取地点名称、行程安排、时间建议
2. 按照正常规划流程（第一步到第五步）处理提取到的地点
3. 如图片文字不清晰或地点无法识别，告知用户并请求补充`;

// ─── GCJ-02 → WGS-84 coordinate conversion ────────────────────────────────────
function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}
function transformLat(x: number, y: number): number {
  let r =
    -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  r += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y / 30) * Math.PI)) * 2) / 3;
  return r;
}
function transformLng(x: number, y: number): number {
  let r =
    300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
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

// ─── Tool-calling agent loop with SSE streaming ────────────────────────────────
async function runAgentLoop(
  model: ChatOpenAI,
  messages: BaseMessage[],
  amapKey: string | undefined,
  emit: SSEEmitter
): Promise<void> {
  let capturedRoute: any = null;

  const geocodeTool = tool(
    async ({ address }: { address: string }) => {
      if (!amapKey) return JSON.stringify({ error: "AMAP_MAPS_API_KEY 未配置" });
      const result = await gaodeGeocode(address, amapKey);
      if (!result) return JSON.stringify({ error: `无法解析地址: ${address}` });
      return JSON.stringify({ lng: result.lng, lat: result.lat, coordSystem: "GCJ-02" });
    },
    {
      name: "gaode_geocode",
      description: "调用高德地图 REST API 将地址转为 GCJ-02 坐标。提交路线前必须对每个地点调用此工具。",
      schema: z.object({
        address: z.string().describe("地点完整名称，中文或英文"),
      }),
    }
  );

  const directionTool = tool(
    async ({
      origin,
      destination,
      mode,
      city,
    }: {
      origin: string;
      destination: string;
      mode: TransportMode;
      city?: string;
    }) => {
      if (!amapKey) return JSON.stringify({ error: "AMAP_MAPS_API_KEY 未配置" });
      const result = await gaodeDirection(origin, destination, mode, amapKey, city);
      if (!result) return JSON.stringify({ error: `路径规划失败: ${origin} → ${destination}` });
      return JSON.stringify(result);
    },
    {
      name: "gaode_direction",
      description:
        "调用高德地图路径规划 API，获取两点之间的距离和预计时长。origin/destination 使用 gaode_geocode 返回的坐标（格式：'经度,纬度'）。",
      schema: z.object({
        origin: z
          .string()
          .describe("出发地坐标，格式 '经度,纬度'（来自 gaode_geocode）"),
        destination: z
          .string()
          .describe("目的地坐标，格式 '经度,纬度'（来自 gaode_geocode）"),
        mode: z
          .enum(["driving", "walking", "bicycling", "transit"])
          .describe("交通方式：driving驾车 / walking步行 / bicycling骑行 / transit公交"),
        city: z
          .string()
          .optional()
          .describe("城市名，公共交通模式必填，如 '北京'、'成都'"),
      }),
    }
  );

  const submitRouteTool = tool(
    async (input: z.infer<typeof routeSchema>) => {
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
      return "路线已保存。请用温暖友好的语气为用户总结行程亮点。";
    },
    {
      name: "submit_travel_route",
      description:
        "提交完整的结构化旅行计划。坐标必须来自 gaode_geocode，travelTime 填入 gaode_direction 的结果。",
      schema: routeSchema,
    }
  );

  const tools = [geocodeTool, directionTool, submitRouteTool];
  const modelWithTools = (model as any).bindTools(tools);
  const loopMessages = [...messages];
  const MAX_ITER = 20;

  for (let i = 0; i < MAX_ITER; i++) {
    // Tell the user the LLM is thinking
    emit({
      type: "stage",
      message: i === 0 ? "🧠 正在理解需求并规划行程…" : "🧠 正在分析工具返回结果…",
    });

    const response = await modelWithTools.invoke(loopMessages);
    loopMessages.push(response);

    const toolCalls: any[] = response.tool_calls ?? [];

    if (toolCalls.length === 0) {
      // Direct text (chatting, asking for transport mode, or unexpected final)
      const text =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      emit({ type: "text", content: text });
      emit({ type: "route", routeSuggestion: capturedRoute });
      return;
    }

    // Announce the batch of tool calls upfront so the user sees intent immediately
    const geocodeCalls = toolCalls.filter((tc) => tc.name === "gaode_geocode");
    const directionCalls = toolCalls.filter((tc) => tc.name === "gaode_direction");
    const submitCalls = toolCalls.filter((tc) => tc.name === "submit_travel_route");

    if (geocodeCalls.length > 0) {
      emit({ type: "stage", message: `📍 批量获取 ${geocodeCalls.length} 个地点坐标…` });
    }
    if (directionCalls.length > 0) {
      emit({ type: "stage", message: `🗺️ 计算 ${directionCalls.length} 段路线时间…` });
    }
    if (submitCalls.length > 0) {
      emit({ type: "stage", message: "📋 整理并提交完整路线…" });
    }

    // Execute all tool calls in parallel (geocoding & directions benefit greatly)
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        if (tc.name === "gaode_geocode") {
          emit({ type: "progress", message: `📍 ${tc.args?.address ?? "..."}` });
        }

        const matched: any = tools.find((t: any) => t.name === tc.name);
        let result: string;
        if (matched) {
          try {
            const raw = await matched.invoke(tc.args);
            result = typeof raw === "string" ? raw : JSON.stringify(raw);
          } catch (err: any) {
            result = `工具调用失败: ${err?.message ?? err}`;
          }
        } else {
          result = `未知工具: ${tc.name}`;
        }
        return { tc, result };
      })
    );

    // Push ToolMessages in original order (LLM requires matched tool_call_id order)
    let routeSubmittedThisIter = false;
    for (const { tc, result } of toolResults) {
      loopMessages.push(
        new ToolMessage({
          content: result,
          tool_call_id: tc.id ?? `call_${i}_${tc.name}`,
          name: tc.name,
        })
      );
      if (tc.name === "submit_travel_route") routeSubmittedThisIter = true;
    }

    // Stream the final summary after route is submitted
    if (routeSubmittedThisIter) {
      emit({ type: "stage", message: "✍️ 正在生成行程总结…" });
      const stream = await model.stream(loopMessages);
      for await (const chunk of stream) {
        const text = typeof chunk.content === "string" ? chunk.content : "";
        if (text) emit({ type: "text", content: text });
      }
      emit({ type: "route", routeSuggestion: capturedRoute });
      return;
    }
  }

  // MAX_ITER fallback
  emit({ type: "stage", message: "✍️ 正在生成回复…" });
  const stream = await model.stream(loopMessages);
  for await (const chunk of stream) {
    const text = typeof chunk.content === "string" ? chunk.content : "";
    if (text) emit({ type: "text", content: text });
  }
  emit({ type: "route", routeSuggestion: capturedRoute });
}

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const emit: SSEEmitter = (data) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    type MsgContentPart = { type: string; [key: string]: unknown };
    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string | MsgContentPart[] }>;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      emit({ type: "error", status: 400, message: "messages 数组不能为空" });
      res.end();
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      emit({ type: "error", status: 503, message: "后端未配置 OPENAI_API_KEY" });
      res.end();
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

    const langchainMessages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.map((m) => {
        if (m.role === "user") {
          return new HumanMessage(
            typeof m.content === "string"
              ? m.content
              : { content: m.content as any }
          );
        }
        const text =
          typeof m.content === "string"
            ? m.content
            : ((m.content.find((p) => p.type === "text") as any)?.text ?? "");
        return new AIMessage(text);
      }),
    ];

    await runAgentLoop(model, langchainMessages, process.env.AMAP_MAPS_API_KEY, emit);

    emit({ type: "done" });
  } catch (error: any) {
    console.error("[AI] chat error:", error);
    emit({ type: "error", status: 500, message: error?.message ?? "未知错误" });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

export default router;
