'use client';

import MapLibreGL from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
  type MapRef,
} from '@/components/ui/map';
import { cn } from '@/lib/utils';

type MarkerTone = 'default' | 'terminal' | 'driver' | 'ride' | 'region';

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  tone?: MarkerTone;
}

interface MapViewProps {
  pickupLocation?: string;
  dropoffLocation?: string;
  driverLocation?: { latitude: number; longitude: number };
  pickupLat?: number;
  pickupLon?: number;
  dropoffLat?: number;
  dropoffLon?: number;
  points?: MapPoint[];
  showRoute?: boolean;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [121.0244, 14.5547];

const toneClasses: Record<MarkerTone, string> = {
  default: 'bg-slate-700',
  terminal: 'bg-amber-500',
  driver: 'bg-emerald-500',
  ride: 'bg-sky-500',
  region: 'bg-violet-500',
};

function isCoordinate(value?: number) {
  return typeof value === 'number' && Number.isFinite(value);
}

function MarkerDot({ tone = 'default' }: { tone?: MarkerTone }) {
  return (
    <div
      className={cn(
        'h-3.5 w-3.5 rounded-full border-2 border-white shadow-md ring-2 ring-white/70',
        toneClasses[tone]
      )}
    />
  );
}

export function MapView({
  pickupLocation = 'Pickup Location',
  dropoffLocation = 'Dropoff Location',
  driverLocation,
  pickupLat,
  pickupLon,
  dropoffLat,
  dropoffLon,
  points = [],
  showRoute = true,
  height = 'h-64',
}: MapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [roadRouteCoordinates, setRoadRouteCoordinates] = useState<[number, number][]>([]);

  const hasPickup = isCoordinate(pickupLat) && isCoordinate(pickupLon);
  const hasDropoff = isCoordinate(dropoffLat) && isCoordinate(dropoffLon);

  const coordinatesToFit = useMemo(() => {
    const coordinates: [number, number][] = [];

    if (hasPickup) {
      coordinates.push([pickupLon!, pickupLat!]);
    }
    if (hasDropoff) {
      coordinates.push([dropoffLon!, dropoffLat!]);
    }
    if (driverLocation) {
      coordinates.push([driverLocation.longitude, driverLocation.latitude]);
    }
    for (const point of points) {
      coordinates.push([point.longitude, point.latitude]);
    }

    return coordinates.length > 0 ? coordinates : [DEFAULT_CENTER];
  }, [
    driverLocation,
    dropoffLat,
    dropoffLon,
    hasDropoff,
    hasPickup,
    pickupLat,
    pickupLon,
    points,
  ]);

  const routeCoordinates = useMemo(() => {
    const route: [number, number][] = [];

    if (hasPickup) {
      route.push([pickupLon!, pickupLat!]);
    }
    if (driverLocation) {
      route.push([driverLocation.longitude, driverLocation.latitude]);
    }
    if (hasDropoff) {
      route.push([dropoffLon!, dropoffLat!]);
    }

    return route;
  }, [
    driverLocation,
    dropoffLat,
    dropoffLon,
    hasDropoff,
    hasPickup,
    pickupLat,
    pickupLon,
  ]);

  const routeRequestKey = useMemo(() => {
    if (routeCoordinates.length < 2) return '';
    return routeCoordinates
      .map(([longitude, latitude]) => `${longitude.toFixed(6)},${latitude.toFixed(6)}`)
      .join(';');
  }, [routeCoordinates]);

  useEffect(() => {
    let isCancelled = false;

    const loadRoadRoute = async () => {
      if (!showRoute || routeCoordinates.length < 2 || !routeRequestKey) {
        setRoadRouteCoordinates([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/road-route?coordinates=${encodeURIComponent(routeRequestKey)}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error('Failed to load routed line');
        }

        const payload = (await response.json()) as { coordinates?: [number, number][] };

        if (isCancelled) return;

        if (Array.isArray(payload.coordinates) && payload.coordinates.length >= 2) {
          setRoadRouteCoordinates(payload.coordinates);
          return;
        }

        setRoadRouteCoordinates(routeCoordinates);
      } catch {
        if (!isCancelled) {
          // Fallback to direct line if route service is unavailable.
          setRoadRouteCoordinates(routeCoordinates);
        }
      }
    };

    loadRoadRoute();

    return () => {
      isCancelled = true;
    };
  }, [routeCoordinates, routeRequestKey, showRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || coordinatesToFit.length === 0) return;

    if (coordinatesToFit.length === 1) {
      map.easeTo({
        center: coordinatesToFit[0],
        zoom: 13,
        duration: 500,
      });
      return;
    }

    const bounds = new MapLibreGL.LngLatBounds(coordinatesToFit[0], coordinatesToFit[0]);
    for (const coordinate of coordinatesToFit) {
      bounds.extend(coordinate);
    }
    map.fitBounds(bounds, {
      duration: 700,
      maxZoom: 15,
      padding: 80,
    });
  }, [coordinatesToFit]);

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-slate-200', height)}>
      <Map
        ref={mapRef}
        center={coordinatesToFit[0]}
        zoom={13}
        attributionControl={false}
        className="h-full w-full"
        cooperativeGestures
      >
        <MapControls position="bottom-right" showZoom showLocate showFullscreen />

        {showRoute && routeCoordinates.length >= 2 ? (
          <MapRoute
            coordinates={roadRouteCoordinates.length >= 2 ? roadRouteCoordinates : routeCoordinates}
            color="#14622e"
            width={4}
            opacity={0.75}
          />
        ) : null}

        {hasPickup ? (
          <MapMarker longitude={pickupLon!} latitude={pickupLat!}>
            <MarkerContent>
              <MarkerDot tone="ride" />
            </MarkerContent>
            <MarkerTooltip>{pickupLocation}</MarkerTooltip>
          </MapMarker>
        ) : null}

        {hasDropoff ? (
          <MapMarker longitude={dropoffLon!} latitude={dropoffLat!}>
            <MarkerContent>
              <MarkerDot tone="default" />
            </MarkerContent>
            <MarkerTooltip>{dropoffLocation}</MarkerTooltip>
          </MapMarker>
        ) : null}

        {driverLocation ? (
          <MapMarker longitude={driverLocation.longitude} latitude={driverLocation.latitude}>
            <MarkerContent>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/40 blur-sm" />
                <MarkerDot tone="driver" />
              </div>
            </MarkerContent>
            <MarkerTooltip>Driver live location</MarkerTooltip>
          </MapMarker>
        ) : null}

        {points.map((point) => (
          <MapMarker key={point.id} longitude={point.longitude} latitude={point.latitude}>
            <MarkerContent>
              <MarkerDot tone={point.tone ?? 'default'} />
            </MarkerContent>
            <MarkerTooltip>
              <div className="space-y-0.5">
                <p className="font-medium">{point.label}</p>
                {point.description ? <p className="text-[11px] opacity-80">{point.description}</p> : null}
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
