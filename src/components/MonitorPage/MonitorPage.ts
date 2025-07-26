import type { AgentExecution } from '../../types/Agent.js';
import { AgentManager } from '../../services/AgentManager.js';

export class MonitorPage {
  private container: HTMLElement;
  private agentManager: AgentManager;
  private executionsList: HTMLElement;

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
    this.container = this.createElement();
    this.executionsList = this.container.querySelector('.executions-list') as HTMLElement;
    
    this.setupEventListeners();
    this.loadExecutions();
  }

  private createElement(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'monitor-page';
    page.innerHTML = `
      <div class="monitor-header">
        <h2>Agent Execution Monitor</h2>
        <div class="monitor-stats">
          <div class="stat">
            <span class="stat-label">Total Executions:</span>
            <span class="stat-value" id="total-executions">0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Success Rate:</span>
            <span class="stat-value" id="success-rate">0%</span>
          </div>
        </div>
      </div>
      <div class="executions-container">
        <div class="executions-header">
          <h3>Recent Executions</h3>
          <button class="clear-btn" id="clear-executions">Clear All</button>
        </div>
        <div class="executions-list"></div>
      </div>
    `;

    return page;
  }

  private setupEventListeners(): void {
    // Listen for new executions
    this.agentManager.addExecutionListener((execution) => {
      this.addExecutionToList(execution);
      this.updateStats();
    });

    // Clear button
    const clearBtn = this.container.querySelector('#clear-executions') as HTMLButtonElement;
    clearBtn.addEventListener('click', () => {
      this.clearExecutions();
    });
  }

  private loadExecutions(): void {
    const executions = this.agentManager.getExecutions();
    this.executionsList.innerHTML = '';
    
    executions.forEach(execution => {
      this.addExecutionToList(execution);
    });
    
    this.updateStats();
  }

  private addExecutionToList(execution: AgentExecution): void {
    const existingItem = this.executionsList.querySelector(`[data-execution-id="${execution.id}"]`);
    
    if (existingItem) {
      // Update existing item
      existingItem.outerHTML = this.createExecutionItemHTML(execution);
    } else {
      // Add new item at the top
      const executionElement = document.createElement('div');
      executionElement.innerHTML = this.createExecutionItemHTML(execution);
      this.executionsList.insertBefore(executionElement.firstElementChild!, this.executionsList.firstChild);
    }
  }

  private createExecutionItemHTML(execution: AgentExecution): string {
    const statusClass = `status-${execution.status}`;
    const timestamp = execution.timestamp.toLocaleString();
    const duration = execution.duration ? `${execution.duration}ms` : '-';
    const inputPreview = execution.input.length > 100 ? 
      execution.input.substring(0, 100) + '...' : execution.input;
    const outputPreview = execution.output && execution.output.length > 100 ? 
      execution.output.substring(0, 100) + '...' : (execution.output || '-');

    return `
      <div class="execution-item ${statusClass}" data-execution-id="${execution.id}">
        <div class="execution-header">
          <div class="execution-info">
            <span class="agent-name">${execution.agentName}</span>
            <span class="execution-status">${execution.status}</span>
            <span class="execution-time">${timestamp}</span>
            <span class="execution-duration">${duration}</span>
          </div>
        </div>
        <div class="execution-content">
          <div class="execution-input">
            <label>Input:</label>
            <div class="content-text">${this.escapeHtml(inputPreview)}</div>
          </div>
          ${execution.output ? `
            <div class="execution-output">
              <label>Output:</label>
              <div class="content-text">${this.escapeHtml(outputPreview)}</div>
            </div>
          ` : ''}
          ${execution.error ? `
            <div class="execution-error">
              <label>Error:</label>
              <div class="content-text error">${this.escapeHtml(execution.error)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private updateStats(): void {
    const executions = this.agentManager.getExecutions();
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

    const totalElement = this.container.querySelector('#total-executions') as HTMLElement;
    const rateElement = this.container.querySelector('#success-rate') as HTMLElement;
    
    if (totalElement) totalElement.textContent = totalExecutions.toString();
    if (rateElement) rateElement.textContent = `${successRate}%`;
  }

  private clearExecutions(): void {
    this.executionsList.innerHTML = '';
    this.updateStats();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public show(): void {
    this.container.style.display = 'block';
    this.loadExecutions();
  }

  public hide(): void {
    this.container.style.display = 'none';
  }
}