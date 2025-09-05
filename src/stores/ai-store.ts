// src/stores/ai-store.ts
import { create } from 'zustand';

// V0.1 Basic AI State with Multi-Agent Expansion Hooks
interface AIRequest {
  id: string;
  system: string;
  type: string;
  input: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface AISystemStatus {
  isActive: boolean;
  lastRequestId?: string;
  errorCount: number;
  lastError?: string;
}

interface AIState {
  // V0.1 Simple State (Current Implementation)
  isProcessing: boolean;
  currentSystem: string | null;
  error: string | null;
  lastResponse: string | null;
  
  // V0.2+ Multi-Agent Expansion Hooks
  systemStatus: Record<string, AISystemStatus>;
  requestQueue: AIRequest[];
  activeWorkflow: {
    id: string;
    type: string;
    currentStep: string;
    progress: number;
  } | null;
  
  // V0.1 Actions (Current)
  setProcessing: (system: string) => void;
  setComplete: (response?: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  
  // V0.2+ Multi-Agent Actions (Hooks for Future)
  initializeSystem: (systemName: string) => void;
  queueRequest: (request: Omit<AIRequest, 'id' | 'timestamp' | 'status'>) => void;
  processNextRequest: () => void;
  updateRequestStatus: (requestId: string, status: AIRequest['status'], result?: any, error?: string) => void;
  startWorkflow: (workflowType: string) => void;
  updateWorkflowProgress: (step: string, progress: number) => void;
  completeWorkflow: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  // V0.1 Simple State
  isProcessing: false,
  currentSystem: null,
  error: null,
  lastResponse: null,
  
  // V0.2+ Multi-Agent State (Initialize Empty)
  systemStatus: {},
  requestQueue: [],
  activeWorkflow: null,
  
  // V0.1 Actions
  setProcessing: (system: string) => set({
    isProcessing: true,
    currentSystem: system,
    error: null
  }),
  
  setComplete: (response?: string) => set({
    isProcessing: false,
    currentSystem: null,
    lastResponse: response || null
  }),
  
  setError: (error: string) => set({
    isProcessing: false,
    currentSystem: null,
    error
  }),
  
  clearError: () => set({ error: null }),
  
  // V0.2+ Multi-Agent Actions (Future Implementation)
  initializeSystem: (systemName: string) => set((state) => ({
    systemStatus: {
      ...state.systemStatus,
      [systemName]: {
        isActive: true,
        errorCount: 0
      }
    }
  })),
  
  queueRequest: (request) => {
    const newRequest: AIRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    set((state) => ({
      requestQueue: [...state.requestQueue, newRequest]
    }));
    
    // Auto-process if no active workflow
    if (!get().activeWorkflow) {
      get().processNextRequest();
    }
  },
  
  processNextRequest: () => {
    const state = get();
    const nextRequest = state.requestQueue.find(req => req.status === 'pending');
    
    if (nextRequest) {
      set((state) => ({
        requestQueue: state.requestQueue.map(req =>
          req.id === nextRequest.id
            ? { ...req, status: 'processing' }
            : req
        )
      }));
      
      // V0.1: Use simple processing
      get().setProcessing(nextRequest.system);
    }
  },
  
  updateRequestStatus: (requestId, status, result?, error?) => set((state) => ({
    requestQueue: state.requestQueue.map(req =>
      req.id === requestId
        ? { ...req, status, result, error }
        : req
    )
  })),
  
  startWorkflow: (workflowType: string) => set({
    activeWorkflow: {
      id: `wf_${Date.now()}`,
      type: workflowType,
      currentStep: 'initializing',
      progress: 0
    }
  }),
  
  updateWorkflowProgress: (step: string, progress: number) => set((state) => ({
    activeWorkflow: state.activeWorkflow
      ? { ...state.activeWorkflow, currentStep: step, progress }
      : null
  })),
  
  completeWorkflow: () => set({
    activeWorkflow: null,
    isProcessing: false,
    currentSystem: null
  })
}));

// V0.1 Helper: Simple AI call wrapper (maintains current API)
export const useSimpleAI = () => {
  const store = useAIStore();
  
  return {
    isProcessing: store.isProcessing,
    error: store.error,
    lastResponse: store.lastResponse,
    setProcessing: store.setProcessing,
    setComplete: store.setComplete,
    setError: store.setError,
    clearError: store.clearError
  };
};

// V0.2+ Helper: Multi-agent workflow management (Future)
export const useWorkflowManager = () => {
  const store = useAIStore();
  
  return {
    activeWorkflow: store.activeWorkflow,
    systemStatus: store.systemStatus,
    queueRequest: store.queueRequest,
    startWorkflow: store.startWorkflow,
    updateWorkflowProgress: store.updateWorkflowProgress,
    completeWorkflow: store.completeWorkflow
  };
};