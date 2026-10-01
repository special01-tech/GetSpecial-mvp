import { z } from 'zod';

export type OpportunityUrgency = 'high' | 'medium' | 'low';
export type OpportunityType = 'weather' | 'event' | 'holiday' | 'offer' | 'quiet_period' | 'manager';

export interface OpportunityCandidate {
  id: string;
  type: OpportunityType;
  signalId?: string;
  offerId?: string;
  sourceEvent?: string;
  targetTimeWindow?: {
    start: Date;
    end?: Date;
  };
  facts: string[];
  rawScore: number;
  urgency: OpportunityUrgency;
  suggestedTitle: string;
  suggestedAngle: string;
}

export interface OpportunityEvaluation {
  relevant: boolean;
  relevanceScore: number;
  reason: string;
  recommendedAngle: string;
  recommendedTone: string;
  factsUsed: string[];
}

export const OpportunityLlmOutputSchema = z.object({
  relevant: z.boolean(),
  relevance_score: z.number().min(0).max(1),
  title: z.string().min(5).max(70),
  reason: z.string().min(10),
  recommended_angle: z.string(),
  recommended_tone: z.string(),
  facts_used: z.array(z.string()).min(1),
});

export type OpportunityLlmOutput = z.infer<typeof OpportunityLlmOutputSchema>;
