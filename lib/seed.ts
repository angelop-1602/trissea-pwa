import { getPrisma } from './prisma';

const prisma = getPrisma();

async function main() {
  await prisma.driverOffer.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.tODATerminal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.region.deleteMany();

  const region1 = await prisma.region.create({
    data: {
      id: 'region-1',
      name: 'Metro Manila',
      country: 'Philippines',
      primaryColor: '#14622e',
      accentColor: '#fecc04',
      provinces: ['Makati', 'Taguig', 'Pasig', 'Quezon City'],
    },
  });

  const region2 = await prisma.region.create({
    data: {
      id: 'region-2',
      name: 'Cebu',
      country: 'Philippines',
      primaryColor: '#14622e',
      accentColor: '#fecc04',
      provinces: ['Cebu City', 'Mandaue', 'Lapu-Lapu'],
    },
  });

  const tenantMakati = await prisma.tenant.create({
    data: {
      id: 'tenant-makati',
      name: 'Makati Tricycle Services',
      regionId: region1.id,
    },
  });

  const tenantTaguig = await prisma.tenant.create({
    data: {
      id: 'tenant-taguig',
      name: 'Taguig Transport Hub',
      regionId: region1.id,
    },
  });

  const tenantCebu = await prisma.tenant.create({
    data: {
      id: 'tenant-cebu',
      name: 'Cebu Mobility Solutions',
      regionId: region2.id,
    },
  });

  const passenger1 = await prisma.user.create({
    data: {
      id: 'user-passenger-1',
      name: 'Paolo Reyes',
      email: 'paolo.reyes@example.com',
      phone: '+639123123123',
      role: 'passenger',
      tenantId: tenantMakati.id,
      avatar: '/placeholder-user.jpg',
      rating: 4.8,
      completedRides: 42,
      balance: 2500,
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      id: 'user-driver-1',
      name: 'Ramon Cruz',
      email: 'ramon.cruz@example.com',
      phone: '+639321321321',
      role: 'driver',
      tenantId: tenantMakati.id,
      avatar: '/placeholder-user.jpg',
      rating: 4.9,
      completedRides: 156,
      balance: 15800,
      bankAccount: '****1234',
    },
  });

  await prisma.user.create({
    data: {
      id: 'user-admin-1',
      name: 'Anna Rodriguez',
      email: 'admin@example.com',
      phone: '+639173456789',
      role: 'admin',
      tenantId: tenantMakati.id,
    },
  });

  await prisma.user.create({
    data: {
      id: 'user-superadmin-1',
      name: 'Admin System',
      email: 'superadmin@example.com',
      phone: '+639174567890',
      role: 'superadmin',
      tenantId: tenantMakati.id,
    },
  });

  await prisma.tODATerminal.createMany({
    data: [
      {
        id: 'terminal-1',
        name: 'Makati Central Terminal',
        location: 'Makati City Hall Area',
        tenantId: tenantMakati.id,
        latitude: 14.5546,
        longitude: 121.0227,
        capacity: 50,
        currentQueued: 23,
      },
      {
        id: 'terminal-2',
        name: 'Taguig Market Terminal',
        location: 'Bonifacio Global City',
        tenantId: tenantTaguig.id,
        latitude: 14.5599,
        longitude: 121.0623,
        capacity: 40,
        currentQueued: 15,
      },
    ],
  });

  await prisma.ride.create({
    data: {
      id: 'ride-1',
      tenantId: tenantMakati.id,
      passengerId: passenger1.id,
      driverId: driver1.id,
      pickupLocation: 'Makati Medical Center',
      dropoffLocation: 'SM Makati',
      pickupLatitude: 14.552,
      pickupLongitude: 121.0285,
      dropoffLatitude: 14.5536,
      dropoffLongitude: 121.0178,
      status: 'en_route',
      fare: 185,
      distance: 2.4,
      estimatedDuration: 12,
      rideType: 'on-demand',
      driverLatitude: 14.5515,
      driverLongitude: 121.0225,
      createdAt: new Date(Date.now() - 5 * 60000),
      startedAt: new Date(Date.now() - 3 * 60000),
    },
  });

  await prisma.reservation.create({
    data: {
      id: 'res-1',
      tenantId: tenantMakati.id,
      passengerId: passenger1.id,
      terminalId: 'terminal-1',
      boardingTime: new Date(Date.now() + 2 * 3600000),
      status: 'confirmed',
      queuePosition: 5,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
