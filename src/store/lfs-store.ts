import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { LfsRecord } from "@/lib/lfs/schema";
import type { FilterState } from "@/lib/lfs/filters";
import { generateSynthetic2025 } from "@/lib/lfs/synthetic";

interface Dataset {
  source: "synthetic" | "uploaded";
  label: string;
  uploadedAt: string;
  records: LfsRecord[];
}

interface LfsState {
  dataset: Dataset;
  filters: FilterState;
  setDataset: (d: Dataset) => void;
  resetToSynthetic: () => void;
  setFilters: (f: FilterState) => void;
  clearFilters: () => void;
}

const synthetic: Dataset = {
  source: "synthetic",
  label: "Calibration sample only — not a validated live LFS microdata source",
  uploadedAt: new Date().toISOString(),
  records: generateSynthetic2025(),
};

const idbStorage = {
  getItem: async (name: string) => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string) => { await idbSet(name, value); },
  removeItem: async (name: string) => { await idbDel(name); },
};

export const useLfsStore = create<LfsState>()(
  persist(
    (set) => ({
      dataset: synthetic,
      filters: {},
      setDataset: (d) => set({ dataset: d, filters: {} }),
      resetToSynthetic: () => set({ dataset: synthetic, filters: {} }),
      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: "lfs-store-v1",
      storage: createJSONStorage(() => idbStorage),
      // Skip on SSR
      skipHydration: typeof window === "undefined",
    },
  ),
);
