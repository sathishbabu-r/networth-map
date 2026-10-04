"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type InsightEvent =
  | "assessment_started"
  | "step_viewed"
  | "step_completed"
  | "validation_error"
  | "asset_added"
  | "liability_added"
  | "breakdown_toggled"
  | "assessment_resumed"
  | "map_generated"
  | "map_printed"
  | "map_shared"
  | "next_moves_copied"
  | "assessment_deleted";

export type ValidationCode =
  | "profile_required"
  | "income_invalid"
  | "assets_incomplete"
  | "liabilities_incomplete"
  | "expenses_invalid"
  | "investing_invalid"
  | "lifestyle_incomplete"
  | "goals_incomplete"
  | "milestone_incomplete"
  | "actions_incomplete";

export type FeedbackCategory =
  | "confusing"
  | "cannot_continue"
  | "incorrect_number"
  | "display_problem"
  | "other";

export type ClarityRating = "yes" | "partly" | "no";

const SESSION_KEY = "networth-map-insight-session";
let inMemorySessionId: string | undefined;
const sessionId = () => {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return saved;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    inMemorySessionId ??= crypto.randomUUID();
    return inMemorySessionId;
  }
};

const deviceClass = (): "mobile" | "tablet" | "desktop" =>
  window.innerWidth < 640
    ? "mobile"
    : window.innerWidth < 1024
      ? "tablet"
      : "desktop";

export function useProductInsights() {
  const trackMutation=useMutation(api.productInsights.track), feedbackMutation=useMutation(api.productInsights.submitFeedback), completeMutation=useMutation(api.productInsights.completeMap), emailMutation=useMutation(api.productInsights.submitCompletedMapEmail);
  const track = useCallback(
    (
      event: InsightEvent,
      metadata: { step?: number; validationCode?: ValidationCode } = {},
    ) => {
      void trackMutation( {
        sessionId: sessionId(),
        event,
        device: deviceClass(),
        ...metadata,
      }).catch(() => {
        // Product analytics must never interrupt the assessment.
      });
    },
    [trackMutation],
  );

  const submitFeedback = useCallback(
    async (input: {
      step: number;
      category: FeedbackCategory;
      message?: string;
      clarity?: ClarityRating;
    }) => {
      await feedbackMutation( {
        sessionId: sessionId(),
        device: deviceClass(),
        ...input,
      });
    },
    [feedbackMutation],
  );

  const markMapCompleted = useCallback(async () => {
    return await completeMutation( {
      sessionId: sessionId(),
      device: deviceClass(),
    });
  }, [completeMutation]);

  const submitCompletedMapEmail = useCallback(
    async (input: {
      email: string;
      submittedAt: number;
      completionEventId: Id<"productInsightEvents">;
    }) => {
      return await emailMutation(input);
    },
    [emailMutation],
  );

  return {
    track,
    submitFeedback,
    markMapCompleted,
    submitCompletedMapEmail,
  };
}
