import { create } from 'zustand';

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  allocation: number;
}

export interface PortfolioState {
  totalValue: number;
  totalChange24h: number;
  assets: Asset[];
  isLoading: boolean;
  lastUpdated: number | null;
}

interface PortfolioActions {
  setPortfolioData: (data: Omit<PortfolioState, 'isLoading' | 'lastUpdated'>) => void;
  updateAsset: (symbol: string, updates: Partial<Asset>) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (symbol: string) => void;
  setLoading: (loading: boolean) => void;
  refreshPortfolio: () => Promise<void>;
}

type PortfolioStore = PortfolioState & PortfolioActions;

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  // 初始状态
  totalValue: 0,
  totalChange24h: 0,
  assets: [],
  isLoading: false,
  lastUpdated: null,

  // 操作方法
  setPortfolioData: (data) => set({
    ...data,
    lastUpdated: Date.now()
  }),

  updateAsset: (symbol, updates) => set((state) => ({
    assets: state.assets.map(asset =>
      asset.symbol === symbol ? { ...asset, ...updates } : asset
    ),
    lastUpdated: Date.now()
  })),

  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset],
    lastUpdated: Date.now()
  })),

  removeAsset: (symbol) => set((state) => ({
    assets: state.assets.filter(asset => asset.symbol !== symbol),
    lastUpdated: Date.now()
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  refreshPortfolio: async () => {
    const { setLoading } = get();
    setLoading(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 这里可以调用真实的API来获取投资组合数据
      // const portfolioData = await fetchPortfolioData();
      // setPortfolioData(portfolioData);

      setLoading(false);
    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
      setLoading(false);
    }
  }
}));
