import { env } from "../../../env.js";
import type { GrowthAssistant } from "../domain/CapturePorts.js";
import { BeneathPineGrowthAssistant } from "./BeneathPineGrowthAssistant.js";
import { ManualGrowthAssistant } from "./ManualGrowthAssistant.js";
import { OpenAiGrowthAssistant } from "./OpenAiGrowthAssistant.js";

export function createGrowthAssistant(): GrowthAssistant {
  if (env.AI_PROVIDER === "beneath_pine") return new BeneathPineGrowthAssistant();
  if (env.AI_PROVIDER === "openai") return new OpenAiGrowthAssistant();
  return new ManualGrowthAssistant();
}
