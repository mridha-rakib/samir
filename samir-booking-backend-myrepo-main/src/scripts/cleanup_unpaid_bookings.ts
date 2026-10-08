import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting unverified payment bookings cleanup...");
  
  // Find all service bookings
  const bookings = await prisma.service_booking.findMany({
    include: {
      payments: true,
      user: {
        select: {
          email: true,
          fullName: true,
        }
      }
    }
  });

  console.log(`Total service bookings found: ${bookings.length}`);

  const bookingsToDelete = bookings.filter(booking => {
    // If there are no payments, it's unverified
    if (!booking.payments || booking.payments.length === 0) {
      return true;
    }
    
    // If all payments associated have no paymentIntentId, or are UNPAID/REJECTED
    const hasValidPayment = booking.payments.some(payment => 
      payment.paymentIntentId && 
      payment.status !== "UNPAID" && 
      payment.status !== "REJECTED"
    );

    return !hasValidPayment;
  });

  console.log(`Found ${bookingsToDelete.length} unverified service bookings to delete:`);
  
  for (const booking of bookingsToDelete) {
    const paymentStatuses = booking.payments.map(p => `${p.status} (Intent: ${p.paymentIntentId || 'None'})`).join(", ");
    console.log(`- Booking ID: ${booking.id}`);
    console.log(`  User: ${booking.user?.email || 'N/A'} (${booking.user?.fullName || 'N/A'})`);
    console.log(`  Service: ${booking.serviceName}`);
    console.log(`  Date: ${booking.date}`);
    console.log(`  Price: $${booking.totalPrice}`);
    console.log(`  Payments: ${paymentStatuses || 'None'}`);
    console.log("----------------------------------------");
  }

  if (bookingsToDelete.length === 0) {
    console.log("No unverified service bookings found to delete.");
    return;
  }

  const idsToDelete = bookingsToDelete.map(b => b.id);

  console.log("Deleting associated records (StartAndEndProofVideo, Payment, Service_booking)...");

  // 1. Delete associated StartAndEndProofVideo
  const deleteVideosResult = await prisma.startAndEndProofVideo.deleteMany({
    where: {
      bookingId: {
        in: idsToDelete
      }
    }
  });
  console.log(`Deleted ${deleteVideosResult.count} associated proof video records.`);

  // 2. Delete associated Payment records (since they are unverified/unpaid)
  const deletePaymentsResult = await prisma.payment.deleteMany({
    where: {
      service_bookingId: {
        in: idsToDelete
      }
    }
  });
  console.log(`Deleted ${deletePaymentsResult.count} associated payment records.`);

  // 3. Delete associated notifications
  const deleteNotificationsResult = await prisma.notifications.deleteMany({
    where: {
      bookingId: {
        in: idsToDelete
      }
    }
  });
  console.log(`Deleted ${deleteNotificationsResult.count} associated notification records.`);

  // 4. Delete the Service_bookings themselves
  const deleteBookingsResult = await prisma.service_booking.deleteMany({
    where: {
      id: {
        in: idsToDelete
      }
    }
  });
  console.log(`Successfully deleted ${deleteBookingsResult.count} unverified service bookings.`);
}

main()
  .catch(e => {
    console.error("Error running cleanup script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
