export interface FeatureSectionData {
  title: string;
  description: string;
  shortcut: string;
}

export class FeatureSection {
  private element: HTMLElement;

  constructor(data: FeatureSectionData, container: HTMLElement) {
    this.element = this.createElement(data);
    container.appendChild(this.element);
  }

  private createElement(data: FeatureSectionData): HTMLElement {
    const section = document.createElement('div');
    section.className = 'feature-section';

    const title = document.createElement('h2');
    title.className = 'feature-section__title';
    title.textContent = data.title;

    const description = document.createElement('p');
    description.className = 'feature-section__description';
    description.textContent = data.description;

    const shortcut = document.createElement('div');
    shortcut.className = 'feature-section__shortcut';
    shortcut.innerHTML = `<span class="shortcut-label">Shortcut:</span> <kbd class="shortcut-key">${data.shortcut}</kbd>`;

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(shortcut);

    return section;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}