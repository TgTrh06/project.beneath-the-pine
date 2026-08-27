import { brainDumpAiSchema, helpMeStartAiSchema, type BrainDumpAiOutput, type HelpMeStartAiOutput, type WeeklyReviewAiOutput } from "@beneath-the-pine/contracts";
import { env } from "../../../env.js";
import type { GrowthAssistant } from "../domain/CapturePorts.js";
import { ManualGrowthAssistant, crisisSafety } from "./ManualGrowthAssistant.js";

type InferenceResponse = { output: unknown; modelVersion?: string };

/** Calls the project-owned model service. Failures always degrade to deterministic guidance. */
export class BeneathPineGrowthAssistant implements GrowthAssistant {
  public constructor(private readonly fallback = new ManualGrowthAssistant()) {}
  async extractBrainDump(content: string): Promise<BrainDumpAiOutput> {
    if (crisisSafety(content).needsHumanSupport) return this.fallback.extractBrainDump(content);
    return this.request("/v1/brain-dump", { content }, brainDumpAiSchema, () => this.fallback.extractBrainDump(content));
  }
  async helpStart(content: string): Promise<HelpMeStartAiOutput> {
    if (crisisSafety(content).needsHumanSupport) return this.fallback.helpStart(content);
    return this.request("/v1/help-me-start", { content }, helpMeStartAiSchema, () => this.fallback.helpStart(content));
  }
  async reviewWeek(facts: unknown): Promise<WeeklyReviewAiOutput> { return this.fallback.reviewWeek(facts); }
  private async request<T>(path: string, body: unknown, schema: { parse(value: unknown): T }, fallback: () => Promise<T>): Promise<T> {
    if (!env.INFERENCE_SERVICE_URL || !env.INFERENCE_SERVICE_TOKEN) return fallback();
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), env.INFERENCE_TIMEOUT_MS);
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch(`${env.INFERENCE_SERVICE_URL}${path}`, { method: "POST", signal: abort.signal, headers: { "content-type": "application/json", authorization: `Bearer ${env.INFERENCE_SERVICE_TOKEN}`, "x-repair-attempt": String(attempt) }, body: JSON.stringify(body) });
        if (!response.ok) break;
        const payload = await response.json() as InferenceResponse;
        try { return schema.parse(payload.output); } catch { /* request one repair pass */ }
      }
    } catch { /* never surface private input in logs */ } finally { clearTimeout(timer); }
    return fallback();
  }
}
