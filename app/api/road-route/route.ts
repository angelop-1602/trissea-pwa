import { NextRequest, NextResponse } from 'next/server';

interface OsrmRouteResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}

function parseCoordinatePair(input: string): [number, number] | null {
  const [longitudeRaw, latitudeRaw] = input.split(',');
  const longitude = Number(longitudeRaw);
  const latitude = Number(latitudeRaw);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return null;
  }

  return [longitude, latitude];
}

export async function GET(request: NextRequest) {
  const coordinatesParam = request.nextUrl.searchParams.get('coordinates');

  if (!coordinatesParam) {
    return NextResponse.json(
      { error: 'Missing required "coordinates" query parameter.' },
      { status: 400 }
    );
  }

  const coordinates = coordinatesParam
    .split(';')
    .map((item) => item.trim())
    .map(parseCoordinatePair)
    .filter((item): item is [number, number] => item !== null);

  if (coordinates.length < 2) {
    return NextResponse.json(
      { error: 'At least two valid coordinate pairs are required.' },
      { status: 400 }
    );
  }

  const coordinateString = coordinates
    .map(([longitude, latitude]) => `${longitude},${latitude}`)
    .join(';');

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(osrmUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Road routing service is currently unavailable.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as OsrmRouteResponse;
    const routedCoordinates = data.routes?.[0]?.geometry?.coordinates;

    if (!Array.isArray(routedCoordinates) || routedCoordinates.length < 2) {
      return NextResponse.json(
        { error: 'No route geometry returned by routing service.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ coordinates: routedCoordinates });
  } catch {
    return NextResponse.json(
      { error: 'Failed to resolve road-following route.' },
      { status: 502 }
    );
  }
}
