import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedText = text.substring(0, 300);

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const ELEVENLABS_VOICE_ID = Deno.env.get("ELEVENLABS_VOICE_ID");

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      console.error("Missing ElevenLabs credentials");
      return new Response(
        JSON.stringify({ error: "TTS not configured", audioBase64: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.85,
            style: 0.8,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("ElevenLabs error:", errorText);
      return new Response(
        JSON.stringify({ error: "TTS generation failed", audioBase64: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64 = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({
        audioBase64: `data:audio/mpeg;base64,${base64}`,
        textLength: trimmedText.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bolinha-tts:", error);
    return new Response(
      JSON.stringify({ error: error.message, audioBase64: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
