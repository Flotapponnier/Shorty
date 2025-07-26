import type { BaseAgent, AgentExecution, AgentContext, AgentResult } from '../types/Agent.js';

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();
  private executions: AgentExecution[] = [];
  private executionListeners: ((execution: AgentExecution) => void)[] = [];

  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getShortcut(), agent);
    console.log(`Agent "${agent.getName()}" registered with shortcut: ${agent.getShortcut()}`);
  }

  public getAgent(shortcut: string): BaseAgent | undefined {
    return this.agents.get(shortcut);
  }

  public getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  public async executeAgent(shortcut: string, context: AgentContext): Promise<AgentResult> {
    const agent = this.getAgent(shortcut);
    
    if (!agent) {
      const error = `No agent found for shortcut: ${shortcut}`;
      console.error(error);
      return { success: false, error };
    }

    if (!agent.isEnabled()) {
      const error = `Agent "${agent.getName()}" is disabled`;
      console.error(error);
      return { success: false, error };
    }

    const execution: AgentExecution = {
      id: this.generateExecutionId(),
      agentName: agent.getName(),
      timestamp: new Date(),
      input: context.input,
      status: 'pending'
    };

    this.addExecution(execution);

    try {
      execution.status = 'running';
      this.updateExecution(execution);

      const startTime = Date.now();
      const result = await agent.execute(context);
      const endTime = Date.now();

      execution.duration = endTime - startTime;
      execution.output = result.output;
      execution.status = result.success ? 'completed' : 'failed';
      execution.error = result.error;

      this.updateExecution(execution);

      console.log(`Agent "${agent.getName()}" execution completed:`, result);
      return result;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      this.updateExecution(execution);

      const errorMsg = `Agent "${agent.getName()}" execution failed: ${execution.error}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  public getExecutions(): AgentExecution[] {
    return [...this.executions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public addExecutionListener(listener: (execution: AgentExecution) => void): void {
    this.executionListeners.push(listener);
  }

  public removeExecutionListener(listener: (execution: AgentExecution) => void): void {
    const index = this.executionListeners.indexOf(listener);
    if (index > -1) {
      this.executionListeners.splice(index, 1);
    }
  }

  private addExecution(execution: AgentExecution): void {
    this.executions.push(execution);
    this.notifyExecutionListeners(execution);
  }

  private updateExecution(execution: AgentExecution): void {
    this.notifyExecutionListeners(execution);
  }

  private notifyExecutionListeners(execution: AgentExecution): void {
    this.executionListeners.forEach(listener => {
      try {
        listener(execution);
      } catch (error) {
        console.error('Error in execution listener:', error);
      }
    });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}