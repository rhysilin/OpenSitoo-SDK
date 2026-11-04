import type { AppImageReference } from './attachments.js';
/** Application-scoped Pi conversation. No filesystem, shell or image execution tools. */
export interface AppAgentConfiguration {
    model: string;
    instructions: string;
    reasoningEffort?: AppReasoningEffort;
}
export interface AppAgentMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    error?: string;
    stopped?: boolean;
}
export interface AppAgentState {
    sessionId?: string;
    status: 'closed' | 'ready' | 'running' | 'error';
    messages: AppAgentMessage[];
    reasoningEffort?: AppReasoningEffort;
    reasoningLevels?: AppReasoningEffort[];
    contextUsage?: {
        tokens: number | null;
        contextWindow: number;
    };
    error?: string;
}
export interface AppAgentSend {
    requestId: string;
    text: string;
    /** Current application state, sent as data alongside this turn. */
    context?: string;
    attachments?: AppImageReference[];
}
/** Trusted host provider; scope and application identity never come from the iframe. */
export interface AppAgentProvider {
    operate(scope: string, appId: string, digest: string, operation: string, input: unknown): Promise<AppAgentState>;
    busy(scope: string, appId: string): boolean;
}
export type AppReasoningEffort = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
export interface AppDictationState {
    status: 'idle' | 'starting' | 'running' | 'ended';
    text: string;
    error?: string;
}
