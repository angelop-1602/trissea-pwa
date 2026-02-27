'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockDB, User, Tenant, Region, Ride, RideStatus, getRideById } from './mock-db';

interface StoreContextType {
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentRegion: Region | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  rides: Ride[];
  updateRideStatus: (rideId: string, status: RideStatus) => void;
  getTenantBranding: () => { logo?: string; primaryColor?: string; accentColor?: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [rides, setRides] = useState<Ride[]>(mockDB.rides);

  // Initialize with default tenant context only.
  // Do not auto-login a role user on app load.
  useEffect(() => {
    const defaultTenant = mockDB.tenants[0];
    const defaultRegion = mockDB.regions[0];

    setCurrentTenant(defaultTenant);
    setCurrentRegion(defaultRegion);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRides((prevRides) =>
        prevRides.map((ride) => {
          // Progress ride status automatically
          if (ride.status === 'searching' && Math.random() > 0.7) {
            return { ...ride, status: 'matched' as RideStatus, driverId: 'user-driver-1' };
          }
          if (ride.status === 'matched' && Math.random() > 0.7) {
            return { ...ride, status: 'en-route' as RideStatus, startedAt: new Date() };
          }
          if (ride.status === 'en-route' && Math.random() > 0.7) {
            return { ...ride, status: 'arrived' as RideStatus };
          }
          if (ride.status === 'arrived' && Math.random() > 0.7) {
            return { ...ride, status: 'in-trip' as RideStatus };
          }
          if (ride.status === 'in-trip' && Math.random() > 0.7) {
            return { ...ride, status: 'completed' as RideStatus, completedAt: new Date() };
          }

          // Update driver location if en-route
          if (ride.status === 'en-route' && ride.driverLocation) {
            const latChange = (Math.random() - 0.5) * 0.001;
            const lonChange = (Math.random() - 0.5) * 0.001;
            return {
              ...ride,
              driverLocation: {
                latitude: ride.driverLocation.latitude + latChange,
                longitude: ride.driverLocation.longitude + lonChange,
              },
            };
          }

          return ride;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateRideStatus = (rideId: string, status: RideStatus) => {
    setRides((prevRides) =>
      prevRides.map((ride) => (ride.id === rideId ? { ...ride, status } : ride))
    );
  };

  const getTenantBranding = () => {
    if (currentTenant?.logo || currentTenant?.primaryColor || currentTenant?.accentColor) {
      return {
        logo: currentTenant.logo,
        primaryColor: currentTenant.primaryColor,
        accentColor: currentTenant.accentColor,
      };
    }

    if (currentRegion?.logo || currentRegion?.primaryColor || currentRegion?.accentColor) {
      return {
        logo: currentRegion.logo,
        primaryColor: currentRegion.primaryColor,
        accentColor: currentRegion.accentColor,
      };
    }

    return {
      logo: undefined,
      primaryColor: '#14622e',
      accentColor: '#fecc04',
    };
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        currentTenant,
        currentRegion,
        setCurrentUser,
        setCurrentTenant,
        rides,
        updateRideStatus,
        getTenantBranding,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
