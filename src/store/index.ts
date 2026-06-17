import { create } from "zustand";
import {
  ProcessCard,
  FurnaceBatch,
  PartItem,
  CarburizingRecord,
  TemperingRecord,
  MetallographyRecord,
  HardnessRecord,
  DeformationRecord,
} from "../types";
import {
  mockProcessCards,
  mockFurnaceBatches,
  mockPartItems,
  mockCarburizingRecords,
  mockTemperingRecords,
  mockMetallographyRecords,
  mockHardnessRecords,
  mockDeformationRecords,
} from "../data/mockData";

const STORAGE_KEY = "heat-treat-mes-data-v1";

interface PersistedState {
  processCards: ProcessCard[];
  furnaceBatches: FurnaceBatch[];
  partItems: PartItem[];
  carburizingRecords: CarburizingRecord[];
  temperingRecords: TemperingRecord[];
  metallographyRecords: MetallographyRecord[];
  hardnessRecords: HardnessRecord[];
  deformationRecords: DeformationRecord[];
}

const loadFromStorage = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to load from localStorage:", e);
  }
  return null;
};

const saveToStorage = (state: PersistedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
};

const initialState = loadFromStorage() || {
  processCards: mockProcessCards,
  furnaceBatches: mockFurnaceBatches,
  partItems: mockPartItems,
  carburizingRecords: mockCarburizingRecords,
  temperingRecords: mockTemperingRecords,
  metallographyRecords: mockMetallographyRecords,
  hardnessRecords: mockHardnessRecords,
  deformationRecords: mockDeformationRecords,
};

interface AppState extends PersistedState {
  addProcessCard: (card: Omit<ProcessCard, "id" | "createdAt" | "updatedAt">) => void;
  updateProcessCard: (id: string, updates: Partial<ProcessCard>) => void;
  deleteProcessCard: (id: string) => void;

  addFurnaceBatch: (batch: Omit<FurnaceBatch, "id">) => void;
  updateFurnaceBatch: (id: string, updates: Partial<FurnaceBatch>) => void;
  deleteFurnaceBatch: (id: string) => void;

  addPartItem: (item: Omit<PartItem, "id">) => void;
  deletePartItem: (id: string) => void;
  updatePartItem: (id: string, updates: Partial<PartItem>) => void;

  addCarburizingRecord: (record: Omit<CarburizingRecord, "id">) => void;
  updateCarburizingRecord: (id: string, updates: Partial<CarburizingRecord>) => void;
  addTemperingRecord: (record: Omit<TemperingRecord, "id">) => void;
  addMetallographyRecord: (record: Omit<MetallographyRecord, "id">) => void;
  addHardnessRecord: (record: Omit<HardnessRecord, "id">) => void;
  addDeformationRecord: (record: Omit<DeformationRecord, "id">) => void;
  updateDeformationRecord: (id: string, updates: Partial<DeformationRecord>) => void;

  resetToMockData: () => void;
  clearAllData: () => void;
}

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

const calcBatchQuantity = (partItems: PartItem[], batchId: string): number => {
  return partItems
    .filter((p) => p.batchId === batchId)
    .reduce((sum, p) => sum + (p.quantity || 0), 0);
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  addProcessCard: (card) => {
    const newCard = {
      ...card,
      id: generateId("pc"),
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    set((state) => ({
      processCards: [...state.processCards, newCard],
    }));
    saveToStorage(get());
  },

  updateProcessCard: (id, updates) => {
    set((state) => ({
      processCards: state.processCards.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toLocaleString() } : c
      ),
    }));
    saveToStorage(get());
  },

  deleteProcessCard: (id) => {
    set((state) => ({
      processCards: state.processCards.filter((c) => c.id !== id),
    }));
    saveToStorage(get());
  },

  addFurnaceBatch: (batch) => {
    const newBatch = { ...batch, id: generateId("fb") };
    set((state) => ({
      furnaceBatches: [...state.furnaceBatches, newBatch],
    }));
    saveToStorage(get());
  },

  updateFurnaceBatch: (id, updates) => {
    set((state) => ({
      furnaceBatches: state.furnaceBatches.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
    saveToStorage(get());
  },

  deleteFurnaceBatch: (id) => {
    set((state) => ({
      furnaceBatches: state.furnaceBatches.filter((b) => b.id !== id),
      partItems: state.partItems.filter((p) => p.batchId !== id),
    }));
    saveToStorage(get());
  },

  addPartItem: (item) => {
    const newItem = { ...item, id: generateId("pt") };
    set((state) => {
      const newPartItems = [...state.partItems, newItem];
      const totalQty = calcBatchQuantity(newPartItems, item.batchId);
      return {
        partItems: newPartItems,
        furnaceBatches: state.furnaceBatches.map((b) =>
          b.id === item.batchId ? { ...b, totalQuantity: totalQty } : b
        ),
      };
    });
    saveToStorage(get());
  },

  deletePartItem: (id) => {
    set((state) => {
      const target = state.partItems.find((p) => p.id === id);
      const newPartItems = state.partItems.filter((p) => p.id !== id);
      if (!target) return { partItems: newPartItems };
      const totalQty = calcBatchQuantity(newPartItems, target.batchId);
      return {
        partItems: newPartItems,
        furnaceBatches: state.furnaceBatches.map((b) =>
          b.id === target.batchId ? { ...b, totalQuantity: totalQty } : b
        ),
      };
    });
    saveToStorage(get());
  },

  updatePartItem: (id, updates) => {
    set((state) => {
      const newPartItems = state.partItems.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      const target = newPartItems.find((p) => p.id === id);
      if (!target) return { partItems: newPartItems };
      const totalQty = calcBatchQuantity(newPartItems, target.batchId);
      return {
        partItems: newPartItems,
        furnaceBatches: state.furnaceBatches.map((b) =>
          b.id === target.batchId ? { ...b, totalQuantity: totalQty } : b
        ),
      };
    });
    saveToStorage(get());
  },

  addCarburizingRecord: (record) => {
    set((state) => ({
      carburizingRecords: [...state.carburizingRecords, { ...record, id: generateId("cb") }],
    }));
    saveToStorage(get());
  },

  updateCarburizingRecord: (id, updates) => {
    set((state) => ({
      carburizingRecords: state.carburizingRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    saveToStorage(get());
  },

  addTemperingRecord: (record) => {
    set((state) => ({
      temperingRecords: [...state.temperingRecords, { ...record, id: generateId("tp") }],
    }));
    saveToStorage(get());
  },

  addMetallographyRecord: (record) => {
    set((state) => ({
      metallographyRecords: [...state.metallographyRecords, { ...record, id: generateId("mt") }],
    }));
    saveToStorage(get());
  },

  addHardnessRecord: (record) => {
    set((state) => ({
      hardnessRecords: [...state.hardnessRecords, { ...record, id: generateId("hd") }],
    }));
    saveToStorage(get());
  },

  addDeformationRecord: (record) => {
    set((state) => ({
      deformationRecords: [...state.deformationRecords, { ...record, id: generateId("df") }],
    }));
    saveToStorage(get());
  },

  updateDeformationRecord: (id, updates) => {
    set((state) => ({
      deformationRecords: state.deformationRecords.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
    saveToStorage(get());
  },

  resetToMockData: () => {
    set({
      processCards: mockProcessCards,
      furnaceBatches: mockFurnaceBatches,
      partItems: mockPartItems,
      carburizingRecords: mockCarburizingRecords,
      temperingRecords: mockTemperingRecords,
      metallographyRecords: mockMetallographyRecords,
      hardnessRecords: mockHardnessRecords,
      deformationRecords: mockDeformationRecords,
    });
    saveToStorage(get());
  },

  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
}));
