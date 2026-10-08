import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Running Prisma test...");
  
  // Try to find a hotel to update
  const hotel = await prisma.hotel.findFirst();
  if (!hotel) {
    console.log("No hotel found in the database. Please create a hotel first.");
    return;
  }
  
  console.log(`Found hotel: ${hotel.propertyTitle} (ID: ${hotel.id})`);
  
  // Let's update this hotel's local tips
  console.log("Updating local tips with latitude and longitude...");
  const updated = await prisma.hotel.update({
    where: { id: hotel.id },
    data: {
      addLocalTips: [
        {
          category: "Coffee",
          subcategory: "Jamal Coffee Shop",
          floor_details: "10th floor, near bathroom",
          latitude: "23.7945",
          longitude: "90.4126",
          isActive: true
        }
      ]
    }
  });
  
  console.log("Updated hotel addLocalTips:", JSON.stringify(updated.addLocalTips, null, 2));
}

main()
  .catch((e) => {
    console.error("Error running test:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
