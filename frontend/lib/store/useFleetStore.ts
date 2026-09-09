import { create } from "zustand";
import { FleetVehicle, CopilotMessage } from "../api/types";
import { MOCK_VEHICLES, getOrCreateCustomVehicle } from "../api/mock";
import { isMockMode, setMockModeOverride } from "../api/client";

export type DashboardTab =
  | "fleet"
  | "state-est"
  | "thermal"
  | "behavior"
  | "knee"
  | "meta-ensemble";

export type ThemeMode = "light" | "dark";
export type ViewMode = "operations" | "engineering";
export type VehicleStatusFilter = "all" | "active" | "warning" | "critical" | "charging";

interface TelemetryInputs {
  voltage: number;
  current: number;
  temperature: number;
  odometer: number;
  cycleCount: number;
  avgSpeed: number;
  maxSpeed: number;
  harshAccel: number;
  harshBrake: number;
  harshCorner: number;
  daysInService: number;
  driveMode: number; // 0=Eco, 1=Normal, 2=Sport
  isCharging: number; // 0=Discharge, 1=Charging
  runKms: number;
  stoppageCount: number;
  energyUtilized: number;
  tempStressIndex: number;
}

interface FleetStoreState {
  theme: ThemeMode;
  viewMode: ViewMode;
  vehicles: FleetVehicle[];
  selectedVehicleId: string;
  selectedLiveTriage: "CRITICAL" | "WARNING" | "NOMINAL" | null;
  activeTab: DashboardTab;
  isMock: boolean;
  isLiveBackendConnected: boolean;
  copilotOpen: boolean;
  copilotMessages: CopilotMessage[];
  telemetry: TelemetryInputs;
  isLiveUpdating: boolean;

  // Enterprise Search & Filters
  searchQuery: string;
  statusFilter: VehicleStatusFilter;
  hubFilter: string;
  stateFilter: string;
  manufacturerFilter: string;

  // Employee Page Orientation & Briefing System
  briefingOpen: boolean;
  activeBriefingKey: string;
  autoShowBriefing: boolean;
  openBriefing: (key?: string) => void;
  closeBriefing: () => void;
  setAutoShowBriefing: (enabled: boolean) => void;
  navigateToPage: (target: "operations" | DashboardTab) => void;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  toggleViewMode: () => void;
  setSelectedVehicle: (id: string) => void;
  setSelectedLiveTriage: (vehicleId: string, triage: "CRITICAL" | "WARNING" | "NOMINAL" | null) => void;
  setActiveTab: (tab: DashboardTab) => void;
  setIsMock: (mock: boolean) => void;
  setIsLiveBackendConnected: (connected: boolean) => void;
  setCopilotOpen: (open: boolean) => void;
  addCopilotMessage: (msg: Omit<CopilotMessage, "id" | "timestamp">) => void;
  clearCopilot: () => void;
  updateTelemetry: (inputs: Partial<TelemetryInputs>) => void;
  toggleLiveUpdating: () => void;
  lookupOrAddVehicle: (id: string) => FleetVehicle;
  getSelectedVehicle: () => FleetVehicle;

  // Enterprise lookup actions
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: VehicleStatusFilter) => void;
  setHubFilter: (h: string) => void;
  setStateFilter: (s: string) => void;
  setManufacturerFilter: (m: string) => void;
  getFilteredVehicles: () => FleetVehicle[];
}

const INITIAL_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: "m-welcome",
    sender: "assistant",
    text: "⚡ **EV Battery Intelligence Copilot Ready.**\n\nI am wired into your multi-zone battery models, fleet telemetry, and degradation prognostics engines. Ask me to diagnose a chassis, explain an alert, or simulate dispatch workloads.",
    timestamp: "System Online",
  },
];

export const useFleetStore = create<FleetStoreState>((set, get) => ({
  theme: "light",
  viewMode: "operations", // Default is user-friendly Operations Mode!
  vehicles: MOCK_VEHICLES,
  selectedVehicleId: MOCK_VEHICLES[0]?.id || "DL1LAN0707",
  selectedLiveTriage: null,
  activeTab: "fleet",
  isMock: false, // LIVE API Connected to port 8000
  isLiveBackendConnected: true,
  copilotOpen: false,
  copilotMessages: INITIAL_COPILOT_MESSAGES,
  isLiveUpdating: true,

  searchQuery: "",
  statusFilter: "all",
  hubFilter: "all",
  stateFilter: "all",
  manufacturerFilter: "all",

  // Page Orientation Briefing defaults
  briefingOpen: true,
  activeBriefingKey: "operations",
  autoShowBriefing: true,

  telemetry: {
    voltage: MOCK_VEHICLES[0]?.voltage || 73.6,
    current: MOCK_VEHICLES[0]?.current || -14.0,
    temperature: MOCK_VEHICLES[0]?.battery_temp || 29.0,
    odometer: Math.floor((MOCK_VEHICLES[0]?.charge_cycle_count || 80) * 58),
    cycleCount: MOCK_VEHICLES[0]?.charge_cycle_count || 80,
    avgSpeed: MOCK_VEHICLES[0]?.speed || 30.0,
    maxSpeed: (MOCK_VEHICLES[0]?.speed || 30.0) + 25,
    harshAccel: 1,
    harshBrake: 1,
    harshCorner: 1,
    daysInService: Math.round((MOCK_VEHICLES[0]?.charge_cycle_count || 80) * 1.4),
    driveMode: 1,
    isCharging: 0,
    runKms: 45.0,
    stoppageCount: 3,
    energyUtilized: 7.2,
    tempStressIndex: 0.15,
  },

  setTheme: (theme: ThemeMode) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

  openBriefing: (key?: string) =>
    set((state) => ({
      briefingOpen: true,
      activeBriefingKey: key || (state.viewMode === "operations" ? "operations" : state.activeTab),
    })),
  closeBriefing: () => set({ briefingOpen: false }),
  setAutoShowBriefing: (enabled: boolean) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("ev_auto_show_page_briefing", enabled ? "true" : "false");
      }
    } catch {}
    set({ autoShowBriefing: enabled });
  },

  navigateToPage: (target: "operations" | DashboardTab) =>
    set((state) => {
      if (target === "operations") {
        return {
          viewMode: "operations",
          briefingOpen: true,
          activeBriefingKey: "operations",
        };
      } else {
        return {
          viewMode: "engineering",
          activeTab: target,
          briefingOpen: true,
          activeBriefingKey: target,
        };
      }
    }),

  setViewMode: (viewMode: ViewMode) =>
    set((state) => {
      const updates: Partial<FleetStoreState> = { viewMode };
      if (state.autoShowBriefing) {
        updates.briefingOpen = true;
        updates.activeBriefingKey = viewMode === "operations" ? "operations" : state.activeTab;
      }
      return updates;
    }),
  toggleViewMode: () =>
    set((state) => {
      const nextMode = state.viewMode === "operations" ? "engineering" : "operations";
      const updates: Partial<FleetStoreState> = { viewMode: nextMode };
      if (state.autoShowBriefing) {
        updates.briefingOpen = true;
        updates.activeBriefingKey = nextMode === "operations" ? "operations" : state.activeTab;
      }
      return updates;
    }),

  setSelectedVehicle: (id: string) => {
    const cleanId = id.trim();
    let v = get().vehicles.find((item) => item.id.toUpperCase() === cleanId.toUpperCase());
    if (!v) {
      v = get().lookupOrAddVehicle(cleanId);
    }

    if (v) {
      set({
        selectedVehicleId: v.id,
        selectedLiveTriage: null,
        telemetry: {
          voltage: v.voltage,
          current: v.current,
          temperature: v.battery_temp,
          odometer: Math.floor(v.charge_cycle_count * 58),
          cycleCount: v.charge_cycle_count,
          avgSpeed: v.speed,
          maxSpeed: v.speed + 25,
          harshAccel: v.status === "warning" ? 5 : v.status === "critical" ? 8 : 1,
          harshBrake: v.status === "critical" ? 6 : 1,
          harshCorner: 1,
          daysInService: Math.round(v.charge_cycle_count * 1.4),
          driveMode: 1,
          isCharging: v.status === "charging" ? 1 : 0,
          runKms: 45.0,
          stoppageCount: 3,
          energyUtilized: 7.2,
          tempStressIndex: Math.max(0, Math.min(1, (v.battery_temp - 25) / 30)),
        },
      });
    }
  },

  setSelectedLiveTriage: (vehicleId, triage) =>
    set((state) => {
      if (vehicleId.toUpperCase() === state.selectedVehicleId.toUpperCase()) {
        return { selectedLiveTriage: triage };
      }
      return {};
    }),

  setActiveTab: (tab: DashboardTab) =>
    set((state) => {
      const updates: Partial<FleetStoreState> = { activeTab: tab, viewMode: "engineering" };
      if (state.autoShowBriefing) {
        updates.briefingOpen = true;
        updates.activeBriefingKey = tab;
      }
      return updates;
    }),

  setIsMock: (mock: boolean) => {
    setMockModeOverride(mock);
    set({ isMock: mock });
  },

  setIsLiveBackendConnected: (connected: boolean) => set({ isLiveBackendConnected: connected }),

  setCopilotOpen: (open: boolean) => set({ copilotOpen: open }),

  addCopilotMessage: (msg) => {
    const newMsg: CopilotMessage = {
      ...msg,
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    set((state) => ({
      copilotMessages: [...state.copilotMessages, newMsg],
    }));
  },

  clearCopilot: () => set({ copilotMessages: INITIAL_COPILOT_MESSAGES }),

  updateTelemetry: (inputs) =>
    set((state) => ({
      telemetry: { ...state.telemetry, ...inputs },
    })),

  toggleLiveUpdating: () =>
    set((state) => ({ isLiveUpdating: !state.isLiveUpdating })),

  getSelectedVehicle: () => {
    const { vehicles, selectedVehicleId } = get();
    const filtered = get().getFilteredVehicles();
    // If the currently selected vehicle is in the filtered list, use it
    const inFiltered = filtered.find((v) => v.id.toUpperCase() === selectedVehicleId.toUpperCase());
    if (inFiltered) return inFiltered;
    // If not, and there are filtered vehicles, return the first filtered vehicle
    if (filtered.length > 0) return filtered[0];
    // Fallback
    return (
      vehicles.find((v) => v.id.toUpperCase() === selectedVehicleId.toUpperCase()) ||
      vehicles[0]
    );
  },

  setSearchQuery: (q: string) => {
    set({ searchQuery: q });
    const filtered = get().getFilteredVehicles();
    const currentMatches = filtered.some((v) => v.id === get().selectedVehicleId);
    if (!currentMatches && filtered.length > 0 && q.trim().length > 1) {
      get().setSelectedVehicle(filtered[0].id);
    }
  },

  setStatusFilter: (s: VehicleStatusFilter) => {
    set({ statusFilter: s });
    const filtered = get().getFilteredVehicles();
    const currentMatches = filtered.some((v) => v.id === get().selectedVehicleId);
    if (!currentMatches && filtered.length > 0) {
      get().setSelectedVehicle(filtered[0].id);
    }
  },

  setHubFilter: (h: string) => {
    set({ hubFilter: h });
    const filtered = get().getFilteredVehicles();
    const currentMatches = filtered.some((v) => v.id === get().selectedVehicleId);
    if (!currentMatches && filtered.length > 0) {
      get().setSelectedVehicle(filtered[0].id);
    }
  },

  setStateFilter: (s: string) => {
    set({ stateFilter: s });
    const filtered = get().getFilteredVehicles();
    const currentMatches = filtered.some((v) => v.id === get().selectedVehicleId);
    if (!currentMatches && filtered.length > 0) {
      get().setSelectedVehicle(filtered[0].id);
    }
  },

  setManufacturerFilter: (m: string) => {
    set({ manufacturerFilter: m });
    const filtered = get().getFilteredVehicles();
    const currentMatches = filtered.some((v) => v.id === get().selectedVehicleId);
    if (!currentMatches && filtered.length > 0) {
      get().setSelectedVehicle(filtered[0].id);
    }
  },

  lookupOrAddVehicle: (id: string) => {
    const vehicle = getOrCreateCustomVehicle(id);
    set((state) => {
      const exists = state.vehicles.some((v) => v.id === vehicle.id);
      return exists ? {} : { vehicles: [vehicle, ...state.vehicles] };
    });
    return vehicle;
  },

  getFilteredVehicles: () => {
    const { vehicles, searchQuery, statusFilter, hubFilter, stateFilter, manufacturerFilter } = get();
    return vehicles.filter((v) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          v.id.toLowerCase().includes(q) ||
          (v.chassis && v.chassis.toLowerCase().includes(q)) ||
          (v.driver && v.driver.toLowerCase().includes(q)) ||
          v.fleet.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all" && v.status !== statusFilter) {
        return false;
      }

      // 3. Hub Filter
      if (hubFilter !== "all" && !v.fleet.toLowerCase().includes(hubFilter.toLowerCase())) {
        return false;
      }

      // 4. State Filter (DL, GJ, KA, MH, TN, UP)
      if (stateFilter !== "all") {
        const sf = stateFilter.toUpperCase().trim();
        const idPrefix = v.id.slice(0, 2).toUpperCase();
        const fleetLower = (v.fleet || "").toLowerCase();
        const matchesState =
          idPrefix === sf ||
          (sf === "DL" && (fleetLower.includes("delhi") || idPrefix === "DL")) ||
          (sf === "GJ" && (fleetLower.includes("ahmedabad") || fleetLower.includes("surat") || fleetLower.includes("gujarat") || idPrefix === "GJ")) ||
          (sf === "KA" && (fleetLower.includes("bengaluru") || fleetLower.includes("bangalore") || fleetLower.includes("karnataka") || idPrefix === "KA")) ||
          (sf === "MH" && (fleetLower.includes("mumbai") || fleetLower.includes("pune") || fleetLower.includes("maharashtra") || idPrefix === "MH")) ||
          (sf === "TN" && (fleetLower.includes("chennai") || fleetLower.includes("coimbatore") || fleetLower.includes("tamil") || idPrefix === "TN")) ||
          (sf === "UP" && (fleetLower.includes("lucknow") || fleetLower.includes("noida") || fleetLower.includes("pradesh") || idPrefix === "UP"));
        if (!matchesState) return false;
      }

      // 5. Manufacturer Filter (Euler Motors, Tata Motors, Mahindra, etc.)
      if (manufacturerFilter !== "all") {
        const mf = manufacturerFilter.toLowerCase().trim();
        const modelLower = (v.model || "").toLowerCase();
        if (!modelLower.includes(mf)) return false;
      }

      return true;
    });
  },
}));
