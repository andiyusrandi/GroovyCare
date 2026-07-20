import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Starting database currentDebt self-healing...");

  const institutions = await db.institution.findMany({
    include: {
      orders: {
        where: {
          status: { in: ["PENDING_SHIPPING", "SHIPPED", "DELIVERED"] },
          paymentMethod: { in: ["TOP", "INVOICE"] },
          paymentStatus: { not: "PAID" }
        },
        include: {
          items: true
        }
      }
    }
  });

  for (const inst of institutions) {
    let actualDebt = 0;
    for (const order of inst.orders) {
      const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      actualDebt += orderTotal;
    }

    console.log(`Institution: ${inst.name}`);
    console.log(`  Current Debt in DB: Rp ${inst.currentDebt.toLocaleString("id-ID")}`);
    console.log(`  Calculated Debt:    Rp ${actualDebt.toLocaleString("id-ID")}`);

    if (inst.currentDebt !== actualDebt) {
      await db.institution.update({
        where: { id: inst.id },
        data: { currentDebt: actualDebt }
      });
      console.log(`  -> UPDATED to Rp ${actualDebt.toLocaleString("id-ID")}`);
    } else {
      console.log(`  -> Matches. No update needed.`);
    }
  }

  console.log("Self-healing completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
