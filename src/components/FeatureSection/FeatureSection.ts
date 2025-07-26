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

    // Add language selector for translation feature
    if (data.title === 'Translate Clipboard/Text Selection') {
      const languageSelector = this.createLanguageSelector();
      section.appendChild(languageSelector);
    }

    section.appendChild(shortcut);

    return section;
  }

  private createLanguageSelector(): HTMLElement {
    const languageContainer = document.createElement('div');
    languageContainer.className = 'feature-language-selector';
    
    languageContainer.innerHTML = `
      <div class="language-selector-inline">
        <label for="feature-language-select">Translate to:</label>
        <select id="feature-language-select" class="language-dropdown-inline">
          <option value="French">French</option>
          <option value="German" selected>German</option>
          <option value="English">English</option>
          <option value="Arabic">Arabic</option>
          <option value="Spanish">Spanish</option>
          <option value="Chinese">Chinese</option>
        </select>
      </div>
    `;

    // Handle language selection
    const languageSelect = languageContainer.querySelector('#feature-language-select') as HTMLSelectElement;
    languageSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.setSelectedLanguage(target.value);
    });

    // Load saved language preference
    this.loadLanguagePreference(languageSelect);

    return languageContainer;
  }

  private setSelectedLanguage(language: string): void {
    localStorage.setItem('selected-language', language);
    console.log(`🌍 Selected language changed to: ${language}`);
  }

  private loadLanguagePreference(selectElement: HTMLSelectElement): void {
    const savedLanguage = localStorage.getItem('selected-language') || 'German';
    selectElement.value = savedLanguage;
    console.log(`🌍 Loaded language preference: ${savedLanguage}`);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}