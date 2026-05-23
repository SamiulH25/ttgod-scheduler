"use client";

import { createContext, useContext } from "react";

type AppData = {
  pendingInvites: number;
};

const AppDataContext = createContext<AppData>({ pendingInvites: 0 });

export function AppDataProvider({
  children,
  pendingInvites,
}: {
  children: React.ReactNode;
  pendingInvites: number;
}) {
  return (
    <AppDataContext.Provider value={{ pendingInvites }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
