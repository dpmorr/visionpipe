import OpenAI from 'openai';
import NewsAPI from 'newsapi';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

// Generate insights about sustainability and circular economy
export async function generateInsights() {
  console.log('Starting OpenAI insights generation...');

  try {
    console.log('Making OpenAI API request...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in sustainability and circular economy. Generate 3 key insights about current trends and developments in sustainability and waste management. Include specific, actionable recommendations."
        },
        {
          role: "user",
          content: `Generate 3 insights about sustainability trends for January 2025. Format as a JSON object with this structure:
{
  "insights": [
    {
      "id": "insight_1",
      "category": "Waste Management Technology",
      "title": "string (max 100 chars)",
      "description": "string (max 200 chars)",
      "impact": "High",
      "recommendations": ["string", "string"],
      "timestamp": "2025-01-23T00:00:00Z"
    }
  ]
}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content received from OpenAI');
      throw new Error("No content received from OpenAI");
    }

    console.log('OpenAI Response:', content);

    // Parse and validate the response
    const parsedContent = JSON.parse(content);
    if (!Array.isArray(parsedContent.insights)) {
      throw new Error("Invalid response format: expected array of insights");
    }

    return parsedContent.insights;
  } catch (error: any) {
    console.error('Error in generateInsights:', error);
    throw error;
  }
}

// Analyze material components and recyclability
export async function analyzeMaterial(product: string) {
  console.log('Starting material analysis for:', product);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `You are an expert in materials science, recycling, and sustainability. 
          Analyze products to identify their components, recyclability, and proper disposal methods. 
          For each component, provide detailed information about its recyclability, processing methods, recovery rates, and specific disposal instructions.`
        },
        {
          role: "user",
          content: `Analyze the following product: ${product}
          
          Provide a detailed breakdown of its components and recyclability in the following JSON format:
          {
            "components": [
              {
                "component": "string (name of component)",
                "recyclable": boolean,
                "processingMethod": "string (how to process/recycle)",
                "recoveryRate": number (0-100),
                "disposalInstructions": "string (specific instructions)",
                "notes": "string (additional information)"
              }
            ]
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log('Material Analysis Response:', content);

    // Parse and validate the response
    const parsedContent = JSON.parse(content);
    if (!Array.isArray(parsedContent.components)) {
      throw new Error("Invalid response format: expected array of components");
    }

    return parsedContent;
  } catch (error) {
    console.error('Error analyzing material:', error);
    throw error;
  }
}

// Helper function to check if an article is relevant to sustainability
function isRelevantToSustainability(title: string, description: string): boolean {
  const relevantKeywords = [
    'waste', 'recycling', 'circular economy', 'sustainability',
    'environmental', 'renewable', 'reuse', 'upcycling',
    'zero waste', 'composting', 'biodegradable', 'eco-friendly',
    'waste management', 'sustainable', 'green technology',
    'resource recovery', 'materials recovery'
  ];

  const content = (title + ' ' + description).toLowerCase();
  return relevantKeywords.some(keyword => content.includes(keyword.toLowerCase()));
}

// Fetch news using NewsAPI with sustainability focus and location filtering
export async function fetchNews(page: number = 1, location: string = 'all') {
  let query = '("waste management" OR recycling OR "circular economy" OR "zero waste" OR sustainability)';

  // Add location-specific filtering
  if (location === 'australia') {
    query += ' AND (australia OR sydney OR melbourne OR brisbane OR perth OR adelaide)';
  }

  const response = await newsapi.v2.everything({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    page: page,
    pageSize: 10 // Get 10 articles per page
  });

  // Filter for relevant articles
  const filteredArticles = response.articles
    .filter(article => isRelevantToSustainability(article.title, article.description))
    .map((article, index) => ({
      id: `news_${index + 1}_page_${page}`,
      title: article.title,
      summary: article.description,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      category: determineCategory(article.title + ' ' + article.description),
      location: location
    }));

  console.log('NewsAPI Response:', filteredArticles);

  // Return both the filtered articles and pagination metadata
  return {
    articles: filteredArticles,
    totalResults: response.totalResults,
    currentPage: page,
    hasMore: page * 10 < response.totalResults
  };
}

// Helper function to determine article category with sustainability focus
function determineCategory(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('recycling') || lowerContent.includes('waste management') || lowerContent.includes('composting')) {
    return 'Waste Management';
  } else if (lowerContent.includes('circular economy') || lowerContent.includes('reuse') || lowerContent.includes('upcycling')) {
    return 'Circular Economy';
  } else if (lowerContent.includes('technology') || lowerContent.includes('innovation')) {
    return 'Green Technology';
  } else if (lowerContent.includes('policy') || lowerContent.includes('regulation')) {
    return 'Environmental Policy';
  } else {
    return 'Sustainability';
  }
}

// Generate recommendations for sustainability initiatives
export async function generateRecommendation() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `You are an AI advisor for sustainable business practices and circular economy initiatives.
Generate a new recommendation for improving sustainability and circular economy practices.
The recommendation should include the following fields in JSON format:
- title: A concise title for the initiative
- description: Detailed explanation of the recommendation
- impact: One of "High", "Medium", or "Low"
- category: One of "Circular Economy", "Recycling", "Waste Management", "Operations", "Partnerships"
- timeframe: Expected implementation time in format "X-Y months" where X and Y are numbers
- roi: One of "High", "Medium", or "Low" based on expected return on investment`
        },
        {
          role: "user",
          content: "Generate a new sustainability initiative recommendation"
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
}