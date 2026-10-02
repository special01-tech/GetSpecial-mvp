import Anthropic from '@anthropic-ai/sdk';

export interface AiCampaignInput {
  restaurant: {
    id: string;
    name: string;
    address: string;
    city?: string;
    timezone?: string;
  };
  brandProfile?: {
    tone?: string;
    toneOfVoice?: string;
    hasPatio?: boolean;
    constraints?: string[];
  };
  offer?: {
    title: string;
    description: string;
    discountValue?: string | number;
  };
  opportunity?: {
    title: string;
    description: string;
    urgency?: string;
  };
  event?: {
    title?: string;
    type?: string;
    date?: string;
  };
  weather?: {
    tempF?: number;
    condition?: string;
    isPatioWeather?: boolean;
  };
  platform: 'instagram' | 'facebook' | 'tiktok' | 'google_business';
  date?: string | Date;
  time?: string;
}

export interface AiCampaignOutput {
  headline: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  recommendedPublishTime: string;
  mediaPrompt: string;
  platform: string;
  isAiGenerated: boolean;
  provider: 'anthropic-claude' | 'deterministic-fallback';
}

export class AiContentService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Génère une campagne adaptée pour un restaurant américain
   * Utilise Claude 3.5 Sonnet si la clé API est fournie, ou un fallback déterministe certifié sans hallucination.
   */
  async generateCampaign(input: AiCampaignInput): Promise<AiCampaignOutput> {
    const { restaurant, brandProfile, offer, opportunity, event, weather, platform, date, time } = input;

    const tone = brandProfile?.toneOfVoice || brandProfile?.tone || 'energetic and welcoming';
    const city = restaurant.city || 'Austin';
    const timeFormatted = time || '4:00 PM';
    const offerTitle = offer?.title || 'Happy Hour Special';
    const offerPrice = offer?.discountValue ? `${offer.discountValue}` : 'Special Discount';

    // Fallback déterministe certifié
    const fallbackResult: AiCampaignOutput = this.buildDeterministicCampaign(input);

    if (!this.anthropic) {
      return fallbackResult;
    }

    try {
      const prompt = `You are an elite marketing copywriter specializing in American restaurants, bars, and sports lounges.
Generate a high-converting, punchy social media post for ${platform.toUpperCase()}.

Context:
- Restaurant: "${restaurant.name}", located in ${city} (${restaurant.address})
- Brand Tone: "${tone}"
- Featured Offer: "${offerTitle}" (${offer?.description || ''}) - Value: ${offerPrice}
- Opportunity: "${opportunity?.title || 'Daily Special'}" - ${opportunity?.description || ''}
${event ? `- Local Event: "${event.title}" (${event.type || 'Event'})` : ''}
${weather ? `- Weather: ${weather.tempF || 75}°F, ${weather.condition || 'clear skies'}` : ''}
- Target Schedule: ${timeFormatted} on ${date ? new Date(date).toDateString() : 'today'}

CRITICAL RULES:
1. Ground Truth Only: STRICTLY NEVER invent facts, fake prices, or fake addresses. Only refer to the offer and details provided.
2. Platform style:
   - Instagram: Visual narrative, enticing hook, line breaks, 3-5 relevant hashtags.
   - TikTok: Ultra-short punchy hook (under 150 chars), high energy, 3 viral tags.
   - Facebook: Community-oriented, inviting, clear call to action, RSVP encouragement.
   - Google Business: Direct, informative, business hours and offer highlight.
3. Return STRICT JSON with keys: headline, caption, hashtags (array of strings), callToAction, recommendedPublishTime, mediaPrompt.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        headline: parsed.headline || fallbackResult.headline,
        caption: parsed.caption || fallbackResult.caption,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : fallbackResult.hashtags,
        callToAction: parsed.callToAction || fallbackResult.callToAction,
        recommendedPublishTime: parsed.recommendedPublishTime || timeFormatted,
        mediaPrompt: parsed.mediaPrompt || fallbackResult.mediaPrompt,
        platform,
        isAiGenerated: true,
        provider: 'anthropic-claude',
      };
    } catch (err) {
      console.warn('[AI_CONTENT_SERVICE] Claude API unavailable or returned invalid JSON. Engaging deterministic fallback:', err);
      return fallbackResult;
    }
  }

  private buildDeterministicCampaign(input: AiCampaignInput): AiCampaignOutput {
    const { restaurant, brandProfile, offer, opportunity, event, weather, platform, time } = input;
    const offerTitle = offer?.title || 'Happy Hour Special';
    const offerPrice = offer?.discountValue ? `${offer.discountValue}` : 'Special Discount';
    const timeFormatted = time || '4:00 PM - 7:00 PM';

    let headline = `Special Today at ${restaurant.name}!`;
    let caption = '';
    let hashtags = [`#${restaurant.name.replace(/[^a-zA-Z0-9]/g, '')}`, '#Foodie', '#Special'];
    let cta = 'Stop by today or reserve your table!';
    let mediaPrompt = 'Delicious high-definition food photography on rustic wood table';

    if (platform === 'tiktok') {
      headline = `Run, don't walk: ${offerTitle} at ${restaurant.name}!`;
      caption = `Looking for the best deal in town? ${offerTitle} is live! Grab ${offerPrice} from ${timeFormatted}. Who are you bringing?`;
      hashtags = ['#FoodTok', '#RestaurantHacks', '#HappyHour', '#AustinEats'];
      cta = 'Tap for directions!';
      mediaPrompt = 'Fast-paced appetizing video shot of sizzling food and cold craft drinks';
    } else if (platform === 'instagram') {
      headline = `Today's Feature: ${offerTitle}`;
      caption = `Elevate your day at ${restaurant.name}.\n\nFeature: ${offerTitle} (${offer?.description || 'Made fresh to order.'})\nHours: ${timeFormatted}\nAddress: ${restaurant.address}\n\nTag your crew and join us on the patio!`;
      hashtags = ['#AustinFood', '#PatioSeason', '#CraftFood', '#HappyHourVibes'];
      cta = 'Link in bio for reservations!';
      mediaPrompt = 'Atmospheric golden-hour photo of patio dining with cocktails and signature plate';
    } else if (platform === 'facebook') {
      headline = `Join Us at ${restaurant.name} for ${offerTitle}!`;
      caption = `Hey neighbors! Whether you are catching the game or unwinding after work, we've got you covered.\n\nEnjoy our ${offerTitle} (${offerPrice}) today from ${timeFormatted}.\n\n${weather ? `Weather is ${weather.tempF}°F — our patio is ready for you!` : ''}\n\nSee you soon at ${restaurant.address}!`;
      hashtags = ['#LocalBusiness', '#CommunityDining', '#GoodFood'];
      cta = 'Call us or drop in!';
      mediaPrompt = 'Wide community gathering shot at lively American dining room';
    } else {
      // Google Business
      headline = `${offerTitle} - Limited Time Feature`;
      caption = `${restaurant.name} is featuring ${offerTitle} (${offerPrice}) starting at ${timeFormatted}. Fresh ingredients, fast friendly service. Visit us at ${restaurant.address}.`;
      hashtags = ['#Restaurant', '#Dining'];
      cta = 'Get Directions';
      mediaPrompt = 'Clear storefront and hero dish photograph';
    }

    if (event?.title) {
      caption += `\n\nPre-game with us before ${event.title}!`;
    }

    return {
      headline,
      caption,
      hashtags,
      callToAction: cta,
      recommendedPublishTime: timeFormatted,
      mediaPrompt,
      platform,
      isAiGenerated: false,
      provider: 'deterministic-fallback',
    };
  }
}

export const aiContentService = new AiContentService();
