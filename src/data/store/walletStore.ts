import { create } from 'zustand';

export type WalletType = 'keplr' | 'metamask' | 'injective' | 'walletconnect';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType | null;
  network: string;
  balance: string;
  isConnecting: boolean;
  wallet: {
    isConnected: boolean;
    address: string | null;
    walletType: WalletType | null;
    network: string;
    balance: string;
  };
}

interface WalletActions {
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: (balance: string) => void;
  setNetwork: (network: string) => void;
}

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>((set) => ({
  // 初始状态
  isConnected: false,
  address: null,
  walletType: null,
  network: 'injective-1',
  balance: '0',
  isConnecting: false,
  wallet: {
    isConnected: false,
    address: null,
    walletType: null,
    network: 'injective-1',
    balance: '0'
  },

  // 操作方法
  connectWallet: async (walletType: WalletType) => {
    try {
      set({ isConnecting: true });

      // 这里应该实现具体的钱包连接逻辑
      // 暂时模拟连接过程
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAddress = 'inj1...'; // 模拟地址
      set({
        isConnected: true,
        address: mockAddress,
        walletType,
        isConnecting: false,
        wallet: {
          isConnected: true,
          address: mockAddress,
          walletType,
          network: 'injective-1',
          balance: '0'
        }
      });
    } catch (error) {
      console.error('钱包连接失败:', error);
      set({ isConnecting: false });
      throw error;
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      address: null,
      walletType: null,
      balance: '0',
      wallet: {
        isConnected: false,
        address: null,
        walletType: null,
        network: 'injective-1',
        balance: '0'
      }
    });
  },

  updateBalance: (balance: string) => set({ balance }),

  setNetwork: (network: string) => set({ network })
}));
