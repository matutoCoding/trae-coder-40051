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

interface AppState {
  processCards: ProcessCard[];
  furnaceBatches: FurnaceBatch[];
  partItems: PartItem[];
  carburizingRecords: CarburizingRecord[];
  temperingRecords: TemperingRecord[];
  metallographyRecords: MetallographyRecord[];
  hardnessRecords: HardnessRecord[];
  deformationRecords: DeformationRecord[];

  addProcessCard: (card: Omit<ProcessCard, "id" | "createdAt" | "updatedAt">) => void;
  updateProcessCard: (id: string, updates: Partial<ProcessCard>) => void;
  deleteProcessCard: (id: string) => void;

  addFurnaceBatch: (batch: Omit<FurnaceBatch, "id">) => void;
  updateFurnaceBatch: (id: string, updates: Partial<FurnaceBatch>) => void;
  deleteFurnaceBatch: (id: string) => void;

  addPartItem: (item: Omit<PartItem, "id">) => void;
  deletePartItem: (id: string) => void;

  addCarburizingRecord: (record: Omit<CarburizingRecord, "id">) => void;
  addTemperingRecord: (record: Omit<TemperingRecord, "id">) => void;
  addMetallographyRecord: (record: Omit<MetallographyRecord, "id">) => void;
  addHardnessRecord: (record: Omit<HardnessRecord, "id">) => void;
  addDeformationRecord: (record: Omit<DeformationRecord, "id">) => void;
  updateDeformationRecord: (id: string, updates: Partial<DeformationRecord>) => void;
}

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

export const useStore = create<AppState>((set) => ({
  processCards: mockProcessCards,
  furnaceBatches: mockFurnaceBatches,
  partItems: mockPartItems,
  carburizingRecords: mockCarburizingRecords,
  temperingRecords: mockTemperingRecords,
  metallographyRecords: mockMetallographyRecords,
  hardnessRecords: mockHardnessRecords,
  deformationRecords: mockDeformationRecords,

  addProcessCard: (card) =>
    set((state) => ({
      processCards: [
        ...state.processCards,
        {
          ...card,
          id: generateId("pc"),
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
        },
      ],
    })),

  updateProcessCard: (id, updates) =>
    set((state) => ({
      processCards: state.processCards.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toLocaleString() } : c
      ),
    })),

  deleteProcessCard: (id) =>
    set((state) => ({
      processCards: state.processCards.filter((c) => c.id !== id),
    })),

  addFurnaceBatch: (batch) =>
    set((state) => ({
      furnaceBatches: [...state.furnaceBatches, { ...batch, id: generateId("fb") }],
    })),

  updateFurnaceBatch: (id, updates) =>
    set((state) => ({
      furnaceBatches: state.furnaceBatches.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  deleteFurnaceBatch: (id) =>
    set((state) => ({
      furnaceBatches: state.furnaceBatches.filter((b) => b.id !== id),
      partItems: state.partItems.filter((p) => p.batchId !== id),
    })),

  addPartItem: (item) =>
    set((state) => ({
      partItems: [...state.partItems, { ...item, id: generateId("pt") }],
    })),

  deletePartItem: (id) =>
    set((state) => ({
      partItems: state.partItems.filter((p) => p.id !== id),
    })),

  addCarburizingRecord: (record) =>
    set((state) => ({
      carburizingRecords: [...state.carburizingRecords, { ...record, id: generateId("cb") }],
    })),

  addTemperingRecord: (record) =>
    set((state) => ({
      temperingRecords: [...state.temperingRecords, { ...record, id: generateId("tp") }],
    })),

  addMetallographyRecord: (record) =>
    set((state) => ({
      metallographyRecords: [...state.metallographyRecords, { ...record, id: generateId("mt") }],
    })),

  addHardnessRecord: (record) =>
    set((state) => ({
      hardnessRecords: [...state.hardnessRecords, { ...record, id: generateId("hd") }],
    })),

  addDeformationRecord: (record) =>
    set((state) => ({
      deformationRecords: [...state.deformationRecords, { ...record, id: generateId("df") }],
    })),

  updateDeformationRecord: (id, updates) =>
    set((state) => ({
      deformationRecords: state.deformationRecords.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),
}));
