import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_analyses",
  title: "List X-ray analyses",
  description: "List chest X-ray analyses (prediction, confidence, findings) belonging to the signed-in MedVision user.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Maximum rows to return (default 20)."),
    prediction: z.enum(["Pneumonia", "Normal"]).optional().describe("Optional filter by prediction label."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, prediction }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("analyses")
      .select("id, prediction, confidence, findings, original_filename, model_used, created_at, patient_id")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (prediction) q = q.eq("prediction", prediction);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { analyses: data ?? [] } };
  },
});
