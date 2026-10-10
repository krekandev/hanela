"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface CartItem {
  id: string; // unique item instance id
  productId: string;
  name: string;
  slug: string;
  category: "mix" | "torty-mieru" | "torty-cheesecakes" | "zakusky";
  image: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  // Customization options:
  size?: string;
  korpus?: string;
  krem?: string;
  doplnky?: string[];
  diets?: string[];
  zdobenie?: string[];
  cakeNote?: string;
  servings?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, newQty: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalPrice: number;
  formattedTotalPrice: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "hanela_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to read cart from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // Check if item with identical product and options already exists
      const existingIndex = prev.findIndex((item) => {
        if (item.productId !== newItem.productId) return false;
        if (item.size !== newItem.size) return false;
        if (item.korpus !== newItem.korpus) return false;
        if (item.krem !== newItem.krem) return false;
        if (item.cakeNote !== newItem.cakeNote) return false;
        const dop1 = (item.doplnky || []).sort().join(",");
        const dop2 = (newItem.doplnky || []).sort().join(",");
        if (dop1 !== dop2) return false;
        const diet1 = (item.diets || []).sort().join(",");
        const diet2 = (newItem.diets || []).sort().join(",");
        if (diet1 !== diet2) return false;
        const zdob1 = (item.zdobenie || []).sort().join(",");
        const zdob2 = (newItem.zdobenie || []).sort().join(",");
        if (zdob1 !== zdob2) return false;
        return true;
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + newItem.quantity;
        const unitP = existing.unitPrice;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: unitP * newQty,
        };
        return updated;
      }

      const generatedId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return [...prev, { ...newItem, id: generatedId }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQty: number) => {
    setItems((prev) => {
      if (newQty <= 0) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) => {
        if (item.id !== id) return item;
        // Enforce minimum 5 ks for zákusky
        const validatedQty = item.category === "zakusky" ? Math.max(5, newQty) : Math.max(1, newQty);
        return {
          ...item,
          quantity: validatedQty,
          totalPrice: item.unitPrice * validatedQty,
        };
      });
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [items]);

  const formattedTotalPrice = useMemo(() => {
    if (Math.floor(totalPrice) === totalPrice) {
      return `${Math.round(totalPrice)} €`;
    }
    return `${totalPrice.toFixed(2).replace(".", ",")} €`;
  }, [totalPrice]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalQuantity,
        totalPrice,
        formattedTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
