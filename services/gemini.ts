import { TechEvent, GroundingMetadata } from "../types";

/**
 * Helper to call our Netlify Backend Function
 */
const callGeminiBackend = async (payload: any) => {
  try {
    // We call the local serverless function path
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to connect to backend:", error);
    throw error;
  }
};

/**
 * Searches for upcoming tech events using Search Grounding.
 */
export const searchTechEvents = async (): Promise<{ events: TechEvent[]; rawText: string; groundingMetadata?: GroundingMetadata }> => {
  try {
    const model = "gemini-2.0-flash";
    const prompt = `
      Act as a highly resourceful tech scout for the Delhi NCR startup and developer ecosystem.
      I need a **massive and diverse list** of upcoming technology events, hackathons, workshops, and meetups for the next 3 months in Delhi NCR.
      
      **SEARCH STRATEGY - EXECUTE THESE SPECIFIC QUERIES:**
      - "site:linkedin.com/events technology Delhi NCR upcoming"
      - "site:devfolio.co Delhi hackathon"
      - "site:meetup.com technology Delhi"
      - "tech conferences Delhi 2026 upcoming"
      
      **TARGET:** Find at least 15 distinct items.

      **REQUIRED OUTPUT FORMAT:**
      
      EVENT_START
      Title: <Event Name>
      Date: <Event Date>
      Location: <Specific Location or Venue>
      Description: <Short summary>
      Source: <DIRECT URL to the page. MUST start with https://>
      Tags: <comma separated tags>
      Cost: <Free/Paid>
      Certificate: <Yes or No>
      EVENT_END

      Order by relevance.
    `;

    // Call Backend
    const data = await callGeminiBackend({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata as GroundingMetadata;
    
    // Manual parsing logic
    const events: TechEvent[] = [];
    const eventBlocks = text.split("EVENT_START");

    eventBlocks.forEach((block: string, index: number) => {
      if (!block.includes("EVENT_END")) return;
      
      const cleanBlock = block.split("EVENT_END")[0];
      const titleMatch = cleanBlock.match(/Title:\s*(.+)/);
      const dateMatch = cleanBlock.match(/Date:\s*(.+)/);
      const locMatch = cleanBlock.match(/Location:\s*(.+)/);
      const descMatch = cleanBlock.match(/Description:\s*(.+)/);
      const sourceMatch = cleanBlock.match(/Source:\s*(.+)/);
      const tagsMatch = cleanBlock.match(/Tags:\s*(.+)/);
      const costMatch = cleanBlock.match(/Cost:\s*(.+)/);
      const certMatch = cleanBlock.match(/Certificate:\s*(.+)/i);

      if (titleMatch) {
        const certString = certMatch ? certMatch[1].trim().toLowerCase() : "no";
        const hasCertificate = certString.includes("yes");

        let tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : ['Tech'];
        tags = tags.filter(t => t.toLowerCase() !== 'big tech');

        let sourceUrl = sourceMatch ? sourceMatch[1].trim() : undefined;
        if (sourceUrl && (sourceUrl.toLowerCase() === 'none' || sourceUrl.length < 5)) sourceUrl = undefined;
        if (sourceUrl && !sourceUrl.startsWith('http')) {
             sourceUrl = `https://${sourceUrl}`;
        }

        events.push({
          id: `evt-${index}-${Date.now()}`,
          title: titleMatch[1].trim(),
          date: dateMatch ? dateMatch[1].trim() : "Upcoming",
          location: locMatch ? locMatch[1].trim() : "Delhi NCR",
          description: descMatch ? descMatch[1].trim() : "No description available.",
          sourceUrl: sourceUrl,
          tags: tags,
          cost: costMatch ? costMatch[1].trim() : "Unknown",
          hasCertificate: hasCertificate,
        });
      }
    });

    return { events, rawText: text, groundingMetadata };
  } catch (error) {
    console.error("Error searching events:", error);
    throw error;
  }
};

/**
 * Fetches detailed information using backend.
 */
export const getEventDetails = async (title: string, description: string): Promise<string> => {
  try {
    const model = "gemini-2.0-flash";
    const prompt = `
      I need a detailed guide for the following event:
      Name: "${title}"
      Context: "${description}"

      Please perform a search to find the official details and provide a response in Markdown format covering:
      1. **Overview**: What is this event?
      2. **Benefits**: Certificates, Swag, Networking, Food.
      3. **Who Should Attend**: Target audience.
      4. **How to Register**: Step-by-step instructions.
      5. **Deadlines & Costs**: Important dates and fees.
      6. **Official Links**: Website or registration page URLs.
      
      **CRITICAL LINK INSTRUCTIONS:** 
      - Provide **clickable** full URLs starting with \`https://\`. 
      
      Make the "How to Register" section very clear with numbered steps.
    `;

    const data = await callGeminiBackend({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No details found.";
  } catch (error) {
    console.error("Error fetching event details:", error);
    return "Unable to fetch details at this moment. Please try again.";
  }
};

/**
 * Explores tech venues using backend (Maps Grounding).
 */
export const exploreTechVenues = async (lat?: number, lng?: number): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = "Recommend 5 best co-working spaces and tech hubs in this area for developers. Provide a brief description for each.";
    
    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (lat && lng) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      };
    }

    const data = await callGeminiBackend({
      model,
      contents: prompt,
      config,
    });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata as GroundingMetadata;

    return { text, groundingMetadata };
  } catch (error) {
    console.error("Error exploring venues:", error);
    throw error;
  }
};

/**
 * Chat with Gemini via Backend.
 */
export const chatWithGemini = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
  try {
    const model = "gemini-2.0-flash";
    
    const data = await callGeminiBackend({
      model,
      contents: history,
    });

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error in chat:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};