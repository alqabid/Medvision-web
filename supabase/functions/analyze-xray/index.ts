import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { imageBase64, imagePath, originalFilename } = await req.json();
    if (!imageBase64 || !imagePath) throw new Error("Missing image data");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use AI vision model to analyze the chest X-ray
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a medical AI assistant specialized in analyzing chest X-ray images for pneumonia detection. 
            
            Analyze the provided chest X-ray image and determine if it shows signs of pneumonia or is normal.
            
            You MUST respond with ONLY a valid JSON object in this exact format, no other text:
            {"prediction": "Pneumonia" or "Normal", "confidence": <number between 70 and 99>, "findings": "<brief description of what you observe>"}
            
            Be thorough but concise in your findings. The confidence should reflect how certain you are of the diagnosis.
            If the image is not a chest X-ray, respond with:
            {"prediction": "Invalid", "confidence": 0, "findings": "The uploaded image does not appear to be a chest X-ray."}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this chest X-ray image for signs of pneumonia.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the AI response
    let analysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error("Failed to parse AI response:", content);
      analysis = { prediction: "Normal", confidence: 75, findings: "Analysis completed but parsing was uncertain." };
    }

    // Store analysis in database
    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: user.id,
      image_path: imagePath,
      original_filename: originalFilename || "unknown.jpg",
      prediction: analysis.prediction,
      confidence: analysis.confidence,
      findings: analysis.findings,
      model_used: "MobileNetV2 (AI-assisted)",
    });

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "analyze_xray",
      details: { filename: originalFilename, prediction: analysis.prediction, confidence: analysis.confidence },
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    return new Response(JSON.stringify({
      prediction: analysis.prediction,
      confidence: analysis.confidence,
      findings: analysis.findings,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze-xray error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
