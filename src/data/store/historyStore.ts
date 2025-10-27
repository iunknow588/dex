import { create } from 'zustand';

export interface Transaction {
  id: string;
  timestamp: number;
  type: 'trade' | 'deposit' | 'withdrawal' | 'flashloan';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
  details?: Record<string, any>;
}

export interface HistoryFilters {
  searchTerm: string;
  type: string;
  status: string;
  dateRange: {
    start: number | null;
    end: number | null;
  };
}

export interface HistoryState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  filters: HistoryFilters;
  isLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  lastUpdated: number | null;
}

interface HistoryActions {
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (filters: Partial<HistoryFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  refreshHistory: () => Promise<void>;
  exportTransactions: (format?: 'csv' | 'json') => void;
}

type HistoryStore = HistoryState & HistoryActions;

const defaultFilters: HistoryFilters = {
  searchTerm: '',
  type: 'all',
  status: 'all',
  dateRange: {
    start: null,
    end: null,
  },
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // 初始状态
  transactions: [],
  filteredTransactions: [],
  filters: defaultFilters,
  isLoading: false,
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0,
  lastUpdated: null,

  // 操作方法
  setTransactions: (transactions) => set((state) => ({
    transactions,
    totalItems: transactions.length,
    filteredTransactions: applyFiltersToTransactions(transactions, state.filters),
    lastUpdated: Date.now()
  })),

  addTransaction: (transaction) => set((state) => {
    const newTransactions = [transaction, ...state.transactions];
    return {
      transactions: newTransactions,
      totalItems: newTransactions.length,
      filteredTransactions: applyFiltersToTransactions(newTransactions, state.filters),
      lastUpdated: Date.now()
    };
  }),

  updateTransaction: (id, updates) => set((state) => {
    const newTransactions = state.transactions.map(tx =>
      tx.id === id ? { ...tx, ...updates } : tx
    );
    return {
      transactions: newTransactions,
      filteredTransactions: applyFiltersToTransactions(newTransactions, state.filters),
      lastUpdated: Date.now()
    };
  }),

  deleteTransaction: (id) => set((state) => {
    const newTransactions = state.transactions.filter(tx => tx.id !== id);
    return {
      transactions: newTransactions,
      totalItems: newTransactions.length,
      filteredTransactions: applyFiltersToTransactions(newTransactions, state.filters),
      lastUpdated: Date.now()
    };
  }),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  clearFilters: () => set((state) => ({
    filters: defaultFilters,
    filteredTransactions: state.transactions
  })),

  applyFilters: () => set((state) => ({
    filteredTransactions: applyFiltersToTransactions(state.transactions, state.filters)
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setItemsPerPage: (items) => set({ itemsPerPage: items }),

  refreshHistory: async () => {
    const { setLoading } = get();
    setLoading(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 这里可以调用真实的API来获取交易历史
      // const transactions = await fetchTransactionHistory();
      // setTransactions(transactions);

      setLoading(false);
    } catch (error) {
      console.error('Failed to refresh history:', error);
      setLoading(false);
    }
  },

  exportTransactions: (format = 'csv') => {
    const { filteredTransactions } = get();

    if (format === 'csv') {
      const csvContent = [
        ['ID', '时间', '类型', '资产', '数量', '价格', '总计', '状态', '交易哈希'],
        ...filteredTransactions.map(tx => [
          tx.id,
          new Date(tx.timestamp).toISOString(),
          tx.type,
          tx.symbol,
          tx.amount.toString(),
          tx.price.toString(),
          tx.total.toString(),
          tx.status,
          tx.txHash || '',
        ]),
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, 'transaction_history.csv');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(filteredTransactions, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, 'transaction_history.json');
    }
  }
}));

// 辅助函数：应用过滤器到交易列表
function applyFiltersToTransactions(transactions: Transaction[], filters: HistoryFilters): Transaction[] {
  return transactions.filter(tx => {
    // 搜索过滤
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        tx.symbol.toLowerCase().includes(searchLower) ||
        tx.txHash?.toLowerCase().includes(searchLower) ||
        tx.id.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // 类型过滤
    if (filters.type !== 'all' && tx.type !== filters.type) {
      return false;
    }

    // 状态过滤
    if (filters.status !== 'all' && tx.status !== filters.status) {
      return false;
    }

    // 日期范围过滤
    if (filters.dateRange.start && tx.timestamp < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && tx.timestamp > filters.dateRange.end) {
      return false;
    }

    return true;
  });
}

// 辅助函数：下载blob文件
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
