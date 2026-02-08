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
    const { model, contents, config } = JSON.parse(event.body || "{}");

    if (!model || !contents) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: model, contents" }),
      };
    }

    // Initialize Gemini AI (matching your project's syntax)
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    // Prepare generation config
    let generationConfig: any = {
      temperature: 0.7,
      maxOutputTokens: 8192,
    };

    // Handle tools configuration
    let tools: any[] | undefined;
    
    if (config?.tools) {
      tools = config.tools.map((tool: any) => {
        if (tool.googleSearch) {
          return { googleSearch: {} };
        }
        if (tool.googleMaps) {
          return { googleMaps: {} };
        }
        return tool;
      });
    }

    // Prepare the request
    const requestOptions: any = {
      generationConfig,
    };

    if (tools && tools.length > 0) {
      requestOptions.tools = tools;
    }

    // Handle tool config (for Maps grounding with location)
    if (config?.toolConfig) {
      requestOptions.toolConfig = config.toolConfig;
    }

    // Prepare contents
    let formattedContents;
    if (typeof contents === 'string') {
      formattedContents = [{ role: 'user', parts: [{ text: contents }] }];
    } else if (Array.isArray(contents)) {
      formattedContents = contents;
    } else {
      formattedContents = [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
    }

    // Generate content
    const result = await geminiModel.generateContent({
      contents: formattedContents,
      ...requestOptions,
    });

    const response = result.response;
    
    // Return the complete response including grounding metadata
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
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
