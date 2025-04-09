// src/types.ts - Central place for shared types

export interface Position {
    baseAssetAmount: number;
    marketIndex: number;
    quoteAssetAmount: number;
    breakEvenPrice: number;
    entryPrice: number; // Not optional anymore
    market?: string;
    liquidationPrice?: number;
    unrealizedPnl?: number;
  }
  
  export interface Order {
    direction: string;
    baseAssetAmount: number;
    price: number;
    marketIndex: number;
    orderType: string;
    orderId: number; // Not optional anymore
    marketId?: string;
    timestamp?: number;
  }