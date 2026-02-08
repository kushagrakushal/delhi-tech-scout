import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Handler, HandlerEvent } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { model, contents, config } = body;

    // Use a default model if not provided, or the one from the request
    const modelName = model || "gemini-1.5-flash"; 

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: modelName });

    // Prepare generation config
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...config, // Allow overriding config from frontend
    };

    // Prepare content for generation
    // Ensure contents are in the correct format for the API
    let formattedContents = contents;
    if (typeof contents === 'string') {
        formattedContents = [{ role: 'user', parts: [{ text: contents }] }];
    }

    // Generate content
    const result = await geminiModel.generateContent({
      contents: formattedContents,
      generationConfig,
    });

    const response = result.response;
    
    // Return the complete response including grounding metadata
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow all origins (CORS)
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
        usageMetadata: response.usageMetadata,
      }),
    };

  } catch (error: any) {
    console.error("Error in Gemini function:", error);

    // --- CRITICAL FIX STARTS HERE ---
    // Check if the error is a 429 (Rate Limit)
    if (error.status === 429 || error.message?.includes('429') || error.statusText === 'Too Many Requests') {
        return {
            statusCode: 429, // Return 429 so the frontend knows to use Cache
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: "Rate limit exceeded",
                message: "Traffic is high. Please wait a moment.",
            }),
        };
    }
    // --- CRITICAL FIX ENDS HERE ---

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error occurred",
      }),
    };
  }
};

export { handler };