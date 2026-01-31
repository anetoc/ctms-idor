import { create } from "zustand"
import { ActionItem, ActionItemFilters, ActionItemStatus } from "@/types"

interface ActionItemsState {
  items: ActionItem[]
  selectedItem: ActionItem | null
  filters: ActionItemFilters
  isLoading: boolean
  error: string | null
}

interface ActionItemsActions {
  setItems: (items: ActionItem[]) => void
  addItem: (item: ActionItem) => void
  updateItem: (id: string, updates: Partial<ActionItem>) => void
  updateItemStatus: (id: string, status: ActionItemStatus) => void
  removeItem: (id: string) => void
  setSelectedItem: (item: ActionItem | null) => void
  setFilters: (filters: Partial<ActionItemFilters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

type ActionItemsStore = ActionItemsState & ActionItemsActions

const initialFilters: ActionItemFilters = {
  category: undefined,
  severity: undefined,
  status: undefined,
  study_id: undefined,
  assigned_to_id: undefined,
  is_overdue: undefined,
}

const initialState: ActionItemsState = {
  items: [],
  selectedItem: null,
  filters: initialFilters,
  isLoading: false,
  error: null,
}

export const useActionItemsStore = create<ActionItemsStore>((set, get) => ({
  ...initialState,

  setItems: (items) =>
    set({
      items,
      isLoading: false,
      error: null,
    }),

  addItem: (item) =>
    set((state) => ({
      items: [item, ...state.items],
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
      selectedItem:
        state.selectedItem?.id === id
          ? { ...state.selectedItem, ...updates }
          : state.selectedItem,
    })),

  updateItemStatus: (id, status) => {
    const updates: Partial<ActionItem> = { status }
    if (status === "done") {
      updates.completed_at = new Date().toISOString()
    }
    get().updateItem(id, updates)
  },

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
    })),

  setSelectedItem: (selectedItem) => set({ selectedItem }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () => set({ filters: initialFilters }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),
}))

// Selector hooks
export const useActionItems = () => useActionItemsStore((state) => state.items)
export const useSelectedActionItem = () => useActionItemsStore((state) => state.selectedItem)
export const useActionItemsFilters = () => useActionItemsStore((state) => state.filters)
export const useActionItemsLoading = () => useActionItemsStore((state) => state.isLoading)

// Computed selectors
export const useFilteredActionItems = () => {
  const items = useActionItemsStore((state) => state.items)
  const filters = useActionItemsStore((state) => state.filters)

  return items.filter((item) => {
    if (filters.category?.length && !filters.category.includes(item.category)) {
      return false
    }
    if (filters.severity?.length && !filters.severity.includes(item.severity)) {
      return false
    }
    if (filters.status?.length && !filters.status.includes(item.status)) {
      return false
    }
    if (filters.study_id && item.study_id !== filters.study_id) {
      return false
    }
    if (filters.assigned_to_id && item.assigned_to_id !== filters.assigned_to_id) {
      return false
    }
    if (filters.is_overdue !== undefined && item.is_overdue !== filters.is_overdue) {
      return false
    }
    return true
  })
}

// Group items by status for Kanban
export const useItemsByStatus = () => {
  const items = useFilteredActionItems()

  return {
    new: items.filter((item) => item.status === "new"),
    in_progress: items.filter((item) => item.status === "in_progress"),
    waiting_external: items.filter((item) => item.status === "waiting_external"),
    done: items.filter((item) => item.status === "done"),
  }
}
