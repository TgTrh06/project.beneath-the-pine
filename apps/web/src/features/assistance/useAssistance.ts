import { useEffect, useReducer, useRef, useState } from 'react';
import { assistanceConfigSchema, assistanceResponseSchema, assistanceContextSchema, assistanceToolsConfigSchema, type AssistanceContext, type AssistanceToolName, type AssistanceToolsConfig, type AssistanceCapability, type AssistanceConfig, type StuckMode } from '@pyneath/contracts';
import { getAssistanceConfig, getAssistanceToolsConfig, getAssistanceContext, requestAssistanceWithTools, recordAssistanceInteraction, requestAssistance } from '../../shared/api/clients/assistance';
import { assistanceReducer, initialAssistanceState, makeAssistanceRequest, visibleAssistanceResult } from './assistanceState';

const enabled = import.meta.env.VITE_ASSISTANCE_DEMO === 'true';

export interface AssistanceOptions {
  capability: AssistanceCapability; value: string; onChoose: (value: string) => void;
  disabled?: boolean; onTakeBreak?: () => void; breakDisabled?: boolean;
  onValueChange?: (value: string) => void;
}

/** Requests and telemetry never accept or execute a suggested product action. */
export function useAssistance({ capability, value, onChoose, disabled = false, onTakeBreak, breakDisabled = false }: AssistanceOptions) {
  const [config, setConfig] = useState<AssistanceConfig | null>(null);
  const [toolsConfig, setToolsConfig] = useState<AssistanceToolsConfig | null>(null);
  const [context, setContext] = useState<AssistanceContext | null>(null);
  const [selectedTools, setSelectedTools] = useState<AssistanceToolName[]>([]);
  const [contextPending, setContextPending] = useState(false);
  const [contextError, setContextError] = useState('');
  const contextLoading = useRef(false);
  const [mode, setMode] = useState<StuckMode>('too_large');
  const [state, dispatch] = useReducer(assistanceReducer, initialAssistanceState);
  const { draft, pending, error } = state;
  const active = useRef(false);
  const mounted = useRef(true);
  const edited = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const proposalInput = useRef<HTMLTextAreaElement>(null);
  const grants = context?.tools.filter(tool => selectedTools.includes(tool.name)).map(({ name, consentToken }) => ({ name, consentToken })) ?? [];
  const signature = JSON.stringify([makeAssistanceRequest(capability, value, mode), grants]);
  const current = useRef(signature);
  const revision = useRef(0);
  if (current.current !== signature) { revision.current++; current.current = signature; }
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    if (enabled) void getAssistanceConfig().then(value => {
      if (!cancelled) setConfig(assistanceConfigSchema.parse(value));
    }).catch(() => { if (!cancelled) setConfig(null); });
    if (enabled) void getAssistanceToolsConfig().then(value => {
      if (!cancelled) setToolsConfig(assistanceToolsConfigSchema.parse(value));
    }).catch(() => { if (!cancelled) setToolsConfig(null); });
    return () => { cancelled = true; mounted.current = false; };
  }, []);
  const available = enabled && Boolean(config?.enabled && config.capabilities.includes(capability));
  const visibleResult = visibleAssistanceResult(state, revision.current);
  const loadContext = async () => {
    if (contextLoading.current || disabled || !toolsConfig?.enabled) return;
    contextLoading.current = true; setContextPending(true); setContextError(''); setSelectedTools([]); setContext(null);
    try {
      const result = assistanceContextSchema.parse(await getAssistanceContext());
      if (mounted.current) setContext(result);
    } catch { if (mounted.current) setContextError('Chưa đọc được ngữ cảnh. Bạn vẫn có thể yêu cầu gợi ý chỉ từ nội dung đã nhập.'); }
    finally { contextLoading.current = false; if (mounted.current) setContextPending(false); }
  };
  const toggleTool = (name: AssistanceToolName, checked: boolean) => {
    setSelectedTools(previous => checked ? [...new Set([...previous, name])] : previous.filter(item => item !== name));
  };

  const track = (action: 'viewed' | 'selected' | 'edited' | 'discarded', response = visibleResult) => {
    if (response?.status === 'suggestion' && response.suggestionId) void recordAssistanceInteraction({ capability, suggestionId: response.suggestionId, action }).catch(() => undefined);
  };
  const ask = async () => {
    if (active.current || disabled || !value.trim()) return;
    active.current = true; dispatch({ type: 'request' });
    const sentRevision = revision.current;
    let focusProposal = false;
    try {
      const input = makeAssistanceRequest(capability, value, mode);
      const response = assistanceResponseSchema.parse(await (grants.length ? requestAssistanceWithTools({ request: input, grants }) : requestAssistance(input)));
      if (!mounted.current || revision.current !== sentRevision) return;
      if (response.output.capability !== capability) throw new Error('Capability mismatch');
      dispatch({ type: 'response', response, sentRevision, currentRevision: revision.current });
      if (response.status === 'suggestion') {
        edited.current = false; focusProposal = response.output.recoveryAction !== 'take_break'; track('viewed', response);
      }
    } catch {
      if (mounted.current && revision.current === sentRevision) dispatch({ type: 'failure', sentRevision, currentRevision: revision.current });
    } finally {
      active.current = false;
      if (mounted.current) {
        dispatch({ type: 'settled' });
        if (revision.current === sentRevision) requestAnimationFrame(() => (focusProposal ? proposalInput.current : trigger.current)?.focus());
      }
    }
  };
  const dismiss = () => { track('discarded'); dispatch({ type: 'dismiss' }); requestAnimationFrame(() => trigger.current?.focus()); };
  const choose = () => {
    if (!draft.trim() || disabled || !visibleResult) return;
    track('selected'); dispatch({ type: 'choose' }); onChoose(draft.trim());
  };
  const takeBreak = () => {
    if (!onTakeBreak || disabled || breakDisabled || !visibleResult) return;
    track('selected'); dispatch({ type: 'choose' }); onTakeBreak();
  };
  const editDraft = (draft: string) => {
    dispatch({ type: 'edit', draft });
    if (!edited.current) { edited.current = true; track('edited'); }
  };
  return { available, config, toolsConfig, context, contextPending, contextError, selectedTools, loadContext, toggleTool,
    mode, setMode, visibleResult, draft, pending, error, trigger, proposalInput, ask, dismiss, choose, takeBreak, editDraft };
}
