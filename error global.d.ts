declare global {
  interface AIStudioStatic {
    hasSelectedApiKey?: () => Promise<boolean>;
    openSelectKey?: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudioStatic;
  }
}

export {};
