import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const ready = action({
  args: {},
  returns: v.boolean(),
  handler: async () => Boolean(process.env.OPENAI_API_KEY),
});
export const transcribe = action({
  args: {
    audio: v.bytes(),
    mimeType: v.union(
      v.literal("audio/webm"),
      v.literal("audio/mp4"),
      v.literal("audio/ogg"),
    ),
  },
  returns: v.object({ text: v.string(), error: v.union(v.string(), v.null()) }),
  handler: async (ctx, { audio, mimeType }) => {
    if (!(await getAuthUserId(ctx)))
      return { text: "", error: "Sign in before recording an answer." };
    if (audio.byteLength < 100 || audio.byteLength > 750000)
      return {
        text: "",
        error:
          "The recording is empty or too large. Please record a shorter answer.",
      };
    const key = process.env.OPENAI_API_KEY;
    if (!key)
      return {
        text: "",
        error:
          "Speech-to-text needs an OpenAI key in Convex before it can run.",
      };
    const extension =
      mimeType === "audio/mp4"
        ? "mp4"
        : mimeType === "audio/ogg"
          ? "ogg"
          : "webm";
    const body = new FormData();
    body.append(
      "file",
      new Blob([audio], { type: mimeType }),
      `answer.${extension}`,
    );
    body.append("model", "whisper-1");
    body.append("response_format", "json");
    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body,
          signal: AbortSignal.timeout(45000),
        },
      );
      if (!response.ok)
        return {
          text: "",
          error:
            response.status === 401
              ? "The speech service key needs updating in Convex."
              : response.status === 429
                ? "The speech service is busy or its billing limit was reached. Please retry shortly."
                : "Speech-to-text could not finish. Retry or type instead.",
        };
      const result = await response.json();
      const text = typeof result.text === "string" ? result.text.trim() : "";
      return text
        ? { text, error: null }
        : {
            text: "",
            error:
              "No words were recognised. Please record again or type instead.",
          };
    } catch {
      return {
        text: "",
        error:
          "Speech-to-text could not connect. Retry the recording or type instead.",
      };
    }
  },
});
