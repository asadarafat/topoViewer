/// <reference types="vite/client" />

declare global {
  var MonacoEnvironment: {
    getWorker(moduleId: string, label: string): Worker;
  };
}

export {};
