import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, inventory, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const inventoryContext = inventory?.map((item: any) => 
      `- ${item.item_name} (${item.category}): ${item.description || 'No description'} - $${item.unit_price}`
    ).join('\n') || 'No inventory available';

    let systemPrompt = '';
    
    if (type === 'chat') {
      systemPrompt = `You are a helpful hardware store assistant for Navira Hardware. Your job is to help customers find the right tools and equipment for their projects.

Available inventory:
${inventoryContext}

Guidelines:
- Be friendly, helpful, and knowledgeable about hardware and tools
- When customers describe a job or project, recommend specific tools from the inventory
- If a customer describes a tool they don't know the name of, help identify it
- Explain why you're recommending certain tools
- If a tool isn't in inventory, let them know and suggest alternatives if possible
- Keep responses concise but informative`;
    } else if (type === 'search') {
      systemPrompt = `You are a hardware tool identifier. Based on the user's description, identify what tool they might be looking for.

Available inventory:
${inventoryContext}

Return a JSON response with:
{
  "possibleTools": ["tool1", "tool2"],
  "confidence": "high/medium/low",
  "explanation": "brief explanation of why these tools match"
}

Only suggest tools that are in the inventory.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        stream: type === 'chat',
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI service unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    if (type === 'chat') {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI Tool Helper error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});