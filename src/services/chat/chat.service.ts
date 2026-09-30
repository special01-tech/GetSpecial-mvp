import { CampaignData, MOCK_CAMPAIGN_DETAIL } from '@/services/campaign/campaign.data';

export type ChatSender = 'assistant' | 'user' | 'system';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: string;
  campaignCard?: {
    campaign: CampaignData;
    status?: 'pending' | 'accepted' | 'rejected' | 'scheduled';
  };
}

export interface QuickSuggestion {
  id: string;
  label: string;
  prompt: string;
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    sender: 'assistant',
    text: "Hello! I am your GetSpecial AI Marketing Assistant. I monitor your local weather, local events, holidays, and foot traffic in real-time to generate high-impact campaigns for your restaurant. 🎯\n\nHow can I assist you today?",
    timestamp: 'Just now',
  },
];

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  {
    id: 'sug_1',
    label: 'What opportunities do you see this week?',
    prompt: 'What opportunities do you see this week?',
  },
  {
    id: 'sug_2',
    label: 'Draft a Happy Hour special',
    prompt: 'Can you draft a Happy Hour campaign for this evening?',
  },
  {
    id: 'sug_3',
    label: 'Pause automated publishing',
    prompt: 'Please pause automatic posting for my restaurant.',
  },
];

export interface ChatAiServiceResponse {
  message: string;
  suggestedAction?: 'pause_toggle' | 'schedule' | 'weekly_plan';
}

export class ChatAiService {
  static async sendMessage(messageText: string, restaurantId?: string, history: ChatMessage[] = []): Promise<ChatAiServiceResponse> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          message: messageText,
          history: history.slice(-4),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.reply?.text) {
          return {
            message: json.data.reply.text,
          };
        }
      }
    } catch (err) {
      console.warn('[CHAT_API_FALLBACK] Could not reach /api/chat, using smart client fallback:', err);
    }

    const lower = messageText.toLowerCase();

    if (lower.includes('pause') || lower.includes('stop')) {
      return {
        message: '🚨 I have paused all automated campaign publishing. You can reactivate anytime from your Rules tab or Dashboard.',
        suggestedAction: 'pause_toggle',
      };
    }

    if (lower.includes('week') || lower.includes('semaine') || lower.includes('opportunité')) {
      return {
        message: 'Here is your weekly marketing forecast:\n\n' +
          '• **Thursday Happy Hour**: Sunny weather (76°F), ideal for promoting craft cocktails & draft beer.\n' +
          '• **Friday Game Night**: Big basketball game downtown at 7:30 PM — recommend a wings combo.\n' +
          '• **Sunday Brunch**: High morning foot traffic expected — push table reservations early.',
        suggestedAction: 'weekly_plan',
      };
    }

    if (lower.includes('happy hour') || lower.includes('wings') || lower.includes('rush')) {
      return {
        message: 'Great! I have drafted a 50% Off Happy Hour Wings promotion scheduled for 4:45 PM on Instagram and Facebook. Tap below to review and approve!',
        suggestedAction: 'schedule',
      };
    }

    return {
      message: `Got it! I am actively tracking local foot traffic, weather, and upcoming events around your restaurant. How else can I assist your marketing today?`,
    };
  }
}
