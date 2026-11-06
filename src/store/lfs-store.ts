import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { LfsRecord } from "@/lib/lfs/schema";
import type { FilterState } from "@/lib/lfs/filters";
import { generateSynthetic2025 } from "@/lib/lfs/synthetic";
import { IS_DEVELOPMENT_MODE } from "@/lib/env";

interface Dataset {
  source: "calibration" | "uploaded" | "official";
  mode: "calibration" | "official";
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
  source: "calibration",
  mode: "calibration",
  label: "Calibration sample only — not official LFS production data",
  uploadedAt: new Date().toISOString(),
  records: IS_DEVELOPMENT_MODE ? generateSynthetic2025() : [],
};

const officialEmpty: Dataset = {
  source: "official",
  mode: "official",
  label: "Production mode — use backend /api/v1 pipelines and generated outputs",
  uploadedAt: new Date().toISOString(),
  records: [],
};

const initialDataset = IS_DEVELOPMENT_MODE ? synthetic : officialEmpty;

const idbStorage = {
  getItem: async (name: string) => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
};

export const useLfsStore = create<LfsState>()(
  persist(
    (set) => ({
      dataset: initialDataset,
      filters: {},
      setDataset: (d) => set({ dataset: IS_DEVELOPMENT_MODE ? d : officialEmpty, filters: {} }),
      resetToSynthetic: () => set({ dataset: initialDataset, filters: {} }),
      setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: IS_DEVELOPMENT_MODE ? "lfs-store-v1-dev" : "lfs-store-v1-prod",
      storage: createJSONStorage(() => idbStorage),
      skipHydration: typeof window === "undefined",
    },
  ),
);
