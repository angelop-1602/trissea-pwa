'use client';

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type { Region, Ride, RideStatus, Tenant, User } from '@prisma/client';

interface StoreContextType {
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentRegion: Region | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  setCurrentRegion: (region: Region | null) => void;
  rides: Ride[];
  updateRideStatus: (rideId: string, status: RideStatus) => void;
  getTenantBranding: () => { logo?: string; primaryColor?: string; accentColor?: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);

  const updateRideStatus = (rideId: string, status: RideStatus) => {
    setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? { ...ride, status } : ride)));
  };

  const getTenantBranding = () => {
    if (currentTenant?.logo || currentTenant?.primaryColor || currentTenant?.accentColor) {
      return {
        logo: currentTenant.logo ?? undefined,
        primaryColor: currentTenant.primaryColor ?? undefined,
        accentColor: currentTenant.accentColor ?? undefined,
      };
    }

    if (currentRegion?.logo || currentRegion?.primaryColor || currentRegion?.accentColor) {
      return {
        logo: currentRegion.logo ?? undefined,
        primaryColor: currentRegion.primaryColor ?? undefined,
        accentColor: currentRegion.accentColor ?? undefined,
      };
    }

    return {
      logo: undefined,
      primaryColor: '#14622e',
      accentColor: '#fecc04',
    };
  };

  const value = useMemo(
    () => ({
      currentUser,
      currentTenant,
      currentRegion,
      setCurrentUser,
      setCurrentTenant,
      setCurrentRegion,
      rides,
      updateRideStatus,
      getTenantBranding,
    }),
    [currentUser, currentTenant, currentRegion, rides]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
