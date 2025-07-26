export interface AgentConfig {
  name: string;
  description: string;
  shortcut: string;
  enabled: boolean;
}

export interface AgentExecution {
  id: string;
  agentName: string;
  timestamp: Date;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  duration?: number;
}

export interface AgentContext {
  input: string;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  output?: string;
  error?: string;
}

export abstract class BaseAgent {
  public config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(context: AgentContext): Promise<AgentResult>;

  public getName(): string {
    return this.config.name;
  }

  public getShortcut(): string {
    return this.config.shortcut;
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }
}