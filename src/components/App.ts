import { FeatureSection, type FeatureSectionData } from './FeatureSection/FeatureSection.js';

export class App {
  private container: HTMLElement;
  private featuresContainer!: HTMLElement;
  private featureSections: FeatureSection[] = [];

  constructor() {
    this.container = document.querySelector('main.container') as HTMLElement;
    this.init();
  }

  private init(): void {
    this.createFeaturesContainer();
    this.renderFeatures();
  }

  private createFeaturesContainer(): void {
    this.featuresContainer = document.createElement('div');
    this.featuresContainer.className = 'features-container';
    this.container.appendChild(this.featuresContainer);
  }

  private renderFeatures(): void {
    const features: FeatureSectionData[] = [
      {
        title: 'LLM',
        description: 'Use cmd+k shortcut to take a screen call an agent and predefine a question with configuring your own button prompt and call the agent to answer your question about it',
        shortcut: 'cmd+k'
      }
    ];

    features.forEach(featureData => {
      const featureSection = new FeatureSection(featureData, this.featuresContainer);
      this.featureSections.push(featureSection);
    });
  }

  public addFeature(featureData: FeatureSectionData): void {
    const featureSection = new FeatureSection(featureData, this.featuresContainer);
    this.featureSections.push(featureSection);
  }

  public destroy(): void {
    this.featureSections.forEach(section => section.destroy());
    this.featureSections = [];
    this.featuresContainer.remove();
  }
}