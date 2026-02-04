"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Set or update the default monthly fee for a user
 */
export async function upsertFeeConfig(userId: string, amount: number) {
  try {
    await prisma.userFeeConfig.upsert({
      where: { userId },
      create: { userId, amount },
      update: { amount },
    });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    console.error("Error updating fee config:", error);
    return { success: false, error: "Failed to update fee configuration" };
  }
}

/**
 * Bulk generate fee records for a specific month/year
 * Only for users who have a non-zero fee config
 */
export async function bulkGenerateFees(
  month: number,
  year: number,
  overrideAmount?: number,
) {
  try {
    // 1. Fetch all users with config
    const users = await prisma.user.findMany({
      include: { feeConfig: true },
    });

    // 2. Fetch ALL existing records for this month/year in one go
    const existingRecords = await prisma.feeRecord.findMany({
      where: {
        month,
        year,
      },
      select: { userId: true },
    });

    // 3. Create a Set of userIds that already have records
    const existingUserIds = new Set(existingRecords.map((r) => r.userId));

    const records = [];
    let count = 0;

    // 4. Filter and build new records in memory
    for (const user of users) {
      if (!existingUserIds.has(user.id)) {
        // Determine amount: Override > Config > 0
        const amount =
          overrideAmount !== undefined
            ? overrideAmount
            : user.feeConfig?.amount || 0;

        if (amount > 0) {
          records.push({
            userId: user.id,
            month,
            year,
            amount,
            status: "PENDING",
          });
          count++;
        }
      }
    }

    // 5. Batch create
    if (records.length > 0) {
      await prisma.feeRecord.createMany({
        // @ts-ignore
        data: records,
        skipDuplicates: true,
      });
    }

    revalidatePath("/admin/fees");
    return { success: true, count };
  } catch (error) {
    console.error("Error generating fees:", error);
    return { success: false, error: "Failed to generate fees" };
  }
}

/**
 * Bulk generate Event Contributions for all users
 */
export async function bulkGenerateEventFunds(title: string, amount: number) {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });

    // Using transaction for atomicity is good, or createMany
    const data = users.map((user) => ({
      userId: user.id,
      title,
      amount,
      status: "PENDING" as const,
    }));

    if (data.length > 0) {
      // @ts-ignore
      await prisma.eventContribution.createMany({
        data,
        skipDuplicates: true, // Prevent duplicates if re-run
      });
    }

    revalidatePath("/admin/fees");
    revalidatePath("/fees");
    return { success: true, count: data.length };
  } catch (error) {
    console.error("Error bulk generating event funds:", error);
    return { success: false, error: "Failed to generate event funds" };
  }
}

/**
 * Fetch all Event Contributions for backend management/display
 */
export async function getAllEventContributions() {
  try {
    const events = await prisma.eventContribution.findMany({
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching event contributions:", error);
    return { success: false, error: "Failed to fetch event contributions" };
  }
}

/**
 * Fetch Event Contributions for a specific user
 */
export async function getUserEventContributions(userId: string) {
  try {
    const events = await prisma.eventContribution.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching user event contributions:", error);
    return {
      success: false,
      error: "Failed to fetch user event contributions",
    };
  }
}

/**
 * Fetch all transactions (Admin View)
 */
export async function getAllTransactions() {
  try {
    const transactions = await prisma.feeTransaction.findMany({
      include: {
        user: { select: { name: true, username: true } },
        allocations: {
          include: {
            feeRecord: true,
            eventContribution: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

/**
 * Record a payment for a user
 * Auto-allocates amount to oldest pending/partial records OR specific Event Contribution
 */
export async function recordPayment(
  userId: string,
  amount: number,
  mode: string,
  reference?: string,
  note?: string,
  targetEventId?: string,
  targetFeeRecordId?: string, // Explicitly target a fee record
) {
  try {
    // 1. Create Transaction
    const transaction = await prisma.feeTransaction.create({
      data: {
        userId,
        amount,
        mode,
        reference,
        note,
      },
    });

    let remainingAmount = amount;

    // 2. Target Allocation (Event)
    if (targetEventId) {
      const eventContribution = await prisma.eventContribution.findUnique({
        where: { id: targetEventId },
      });

      if (eventContribution && remainingAmount > 0) {
        const due = eventContribution.amount - eventContribution.paidAmount;
        const toPay = Math.min(remainingAmount, due);

        if (toPay > 0) {
          remainingAmount -= toPay;
          const newPaid = eventContribution.paidAmount + toPay;
          const newStatus =
            newPaid >= eventContribution.amount ? "PAID" : "PARTIAL";

          await prisma.eventContribution.update({
            where: { id: targetEventId },
            data: { paidAmount: newPaid, status: newStatus },
          });

          await prisma.feeTransactionAllocation.create({
            data: {
              transactionId: transaction.id,
              eventContributionId: targetEventId,
              allocatedAmount: toPay,
            },
          });
        }
      }
    }

    // 3. Target Allocation (Fee Record)
    if (targetFeeRecordId && remainingAmount > 0) {
      const feeRecord = await prisma.feeRecord.findUnique({
        where: { id: targetFeeRecordId },
      });

      if (feeRecord) {
        const due = feeRecord.amount - feeRecord.paidAmount;
        const toPay = Math.min(remainingAmount, due);

        if (toPay > 0) {
          remainingAmount -= toPay;
          const newPaid = feeRecord.paidAmount + toPay;
          const newStatus = newPaid >= feeRecord.amount ? "PAID" : "PARTIAL";

          await prisma.feeRecord.update({
            where: { id: targetFeeRecordId },
            data: { paidAmount: newPaid, status: newStatus },
          });

          await prisma.feeTransactionAllocation.create({
            data: {
              transactionId: transaction.id,
              feeRecordId: targetFeeRecordId,
              allocatedAmount: toPay,
            },
          });
        }
      }
    }

    // 4. Fallback: Monthly Fee Allocation (if no target or remaining amount exists)
    // Note: If user targeted an event, we typically stop there to avoid accidental monthly fee payment?
    // Or should excess go to monthly?
    // User requested "user can pay for these from their profiles". Usually specific.
    // If specific target is set, we use remaining, but typically exact amount is paid.

    if (remainingAmount > 0) {
      const pendingRecords = await prisma.feeRecord.findMany({
        where: {
          userId,
          status: { in: ["PENDING", "PARTIAL"] },
        },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      });

      for (const record of pendingRecords) {
        if (remainingAmount <= 0) break;

        const due = record.amount - record.paidAmount;
        const toPay = Math.min(remainingAmount, due);

        remainingAmount -= toPay;

        const newPaidAmount = record.paidAmount + toPay;
        const newStatus = newPaidAmount >= record.amount ? "PAID" : "PARTIAL";

        await prisma.feeRecord.update({
          where: { id: record.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        await prisma.feeTransactionAllocation.create({
          data: {
            transactionId: transaction.id,
            feeRecordId: record.id,
            allocatedAmount: toPay,
          },
        });
      }
    }

    revalidatePath("/fees");
    revalidatePath("/admin/fees");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

/**
 * Delete an event contribution (only if no payments made)
 */
export async function deleteEventContribution(id: string) {
  try {
    const contribution = await prisma.eventContribution.findUnique({
      where: { id },
    });

    if (!contribution) return { success: false, error: "Event not found" };
    if (contribution.paidAmount > 0)
      return {
        success: false,
        error: "Cannot delete event with recorded payments",
      };

    await prisma.eventContribution.delete({ where: { id } });

    revalidatePath("/admin/fees");
    revalidatePath("/fees"); // User side
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

/**
 * Update event contribution details
 */
export async function updateEventContribution(
  id: string,
  title: string,
  amount: number,
) {
  try {
    await prisma.eventContribution.update({
      where: { id },
      data: { title, amount },
    });

    revalidatePath("/admin/fees");
    revalidatePath("/fees");
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Fetch fee history for a user
 */
export async function getUserFees(userId: string) {
  try {
    const records = await prisma.feeRecord.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return { success: true, data: records };
  } catch (error) {
    console.error("Error fetching user fees:", error);
    return { success: false, error: "Failed to fetch fees" };
  }
}

/**
 * Fetch pending fee records for a user (for Multi-Pay)
 */
export async function getPendingFeeRecords(userId: string) {
  try {
    const records = await prisma.feeRecord.findMany({
      where: {
        userId,
        status: { not: "PAID" },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    return { success: true, data: records };
  } catch (error) {
    console.error("Error fetching pending query:", error);
    return { success: false, error: "Failed to fetch pending dues" };
  }
}

/**
 * Fetch all users with their current fee status for a specific month
 */
export async function getMonthFeeStatus(month: number, year: number) {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        feeConfig: {
          select: { amount: true },
        },
        feeRecords: {
          where: { month, year },
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Format data: User info + Fee info (or null/default if no record)
    const formatted = users.map((user) => {
      const record = user.feeRecords[0];
      const configAmount = user.feeConfig?.amount || 0;

      return {
        userId: user.id,
        name: user.name || user.username,
        username: user.username,
        configAmount,
        record: record || null,
        isGenerated: !!record,
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching month status:", error);
    return { success: false, error: "Failed to fetch month status" };
  }
}

/**
 * Manually update a fee record (Admin override)
 */
export async function updateFeeRecord(
  id: string,
  data: {
    amount?: number;
    paidAmount?: number;
    status?: "PENDING" | "PARTIAL" | "PAID";
  },
) {
  try {
    await prisma.feeRecord.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    console.error("Error updating fee record:", error);
    return { success: false, error: "Failed to update fee record" };
  }
}

/**
 * Create a single fee record for a user (Individual Add)
 */
export async function createFeeRecord(
  userId: string,
  month: number,
  year: number,
  amount: number,
) {
  try {
    await prisma.feeRecord.create({
      data: {
        userId,
        month,
        year,
        amount,
        status: "PENDING",
      },
    });
    revalidatePath("/admin/fees");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create fee record" };
  }
}

/**
 * Fetch all transactions for a user
 */
export async function getUserTransactions(userId: string) {
  try {
    const transactions = await prisma.feeTransaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: {
        allocations: {
          include: {
            feeRecord: true,
            eventContribution: true,
          },
        },
      },
    });
    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

/**
 * Revoke a transaction (Admin only)
 * Reverts the payment allocations and deletes the transaction
 */
export async function revokeTransaction(transactionId: string) {
  try {
    // 1. Get transaction with allocations
    const transaction = await prisma.feeTransaction.findUnique({
      where: { id: transactionId },
      include: { allocations: true },
    });

    if (!transaction) return { success: false, error: "Transaction not found" };

    // 2. Revert allocations
    for (const allocation of transaction.allocations) {
      if (allocation.feeRecordId) {
        const record = await prisma.feeRecord.findUnique({
          where: { id: allocation.feeRecordId },
        });

        if (record) {
          const newPaid = Math.max(
            0,
            record.paidAmount - allocation.allocatedAmount,
          );
          const newStatus =
            newPaid === 0
              ? "PENDING"
              : newPaid >= record.amount
                ? "PAID"
                : "PARTIAL";

          await prisma.feeRecord.update({
            where: { id: record.id },
            data: { paidAmount: newPaid, status: newStatus },
          });
        }
      } else if (allocation.eventContributionId) {
        const contribution = await prisma.eventContribution.findUnique({
          where: { id: allocation.eventContributionId },
        });

        if (contribution) {
          const newPaid = Math.max(
            0,
            contribution.paidAmount - allocation.allocatedAmount,
          );
          const newStatus =
            newPaid === 0
              ? "PENDING"
              : newPaid >= contribution.amount
                ? "PAID"
                : "PARTIAL";

          await prisma.eventContribution.update({
            where: { id: contribution.id },
            data: { paidAmount: newPaid, status: newStatus },
          });
        }
      }
    }

    // 3. Delete transaction (Cascade deletes allocations)
    await prisma.feeTransaction.delete({
      where: { id: transactionId },
    });

    revalidatePath("/fees");
    revalidatePath("/admin/fees");
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error revoking transaction:", error);
    return { success: false, error: "Failed to revoke transaction" };
  }
}

/**
 * Fetch transactions for a specific Fee Record
 */
export async function getFeeRecordTransactions(feeRecordId: string) {
  try {
    const transactions = await prisma.feeTransaction.findMany({
      where: {
        allocations: {
          some: { feeRecordId },
        },
      },
      orderBy: { date: "desc" },
      include: {
        allocations: {
          where: { feeRecordId }, // Only get the allocation relevant to this record
        },
      },
    });
    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching record transactions:", error);
    return { success: false, error: "Failed to fetch transactions" };
  }
}

/**
 * Pay for multiple months for a single user
 */
export async function payUserMonths(
  userId: string,
  payments: { month: number; year: number; amount: number }[],
  adminName: string,
  mode: string = "CASH",
  reference?: string,
) {
  try {
    let successCount = 0;

    // Optimize: Fetch user config once if needed, or rely on passed amount
    // We assume 'amount' passed is the intended amount to pay
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (!user) return { success: false, error: "User not found" };

    for (const payment of payments) {
      // Check/Create Record
      const existingRecord = await prisma.feeRecord.findUnique({
        where: {
          userId_month_year: {
            userId,
            month: payment.month,
            year: payment.year,
          },
        },
      });

      let recordId = existingRecord?.id;

      if (!existingRecord) {
        const newRecord = await prisma.feeRecord.create({
          data: {
            userId,
            month: payment.month,
            year: payment.year,
            amount: payment.amount,
            status: "PENDING",
          },
        });
        recordId = newRecord.id;
      }

      if (recordId) {
        const monthName = new Date(payment.year, payment.month).toLocaleString(
          "default",
          { month: "long" },
        );

        await recordPayment(
          userId,
          payment.amount,
          mode,
          reference || `Multi-Month: Manual by ${adminName}`,
          `Payment for ${monthName} ${payment.year} (Logged by ${adminName})`,
          undefined,
          recordId,
        );
        successCount++;
      }
    }

    revalidatePath("/admin/fees");
    revalidatePath("/profile");

    return { success: true, count: successCount };
  } catch (error) {
    console.error("Error in payUserMonths:", error);
    return { success: false, error: "Failed to process multi-month payments" };
  }
}

/**
 * Bulk mark fees as PAID for selected users
 */
export async function bulkMarkFeePaid(
  userIds: string[],
  month: number,
  year: number,
  adminName: string,
) {
  try {
    let count = 0;
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
    });

    // 1. Batch fetch Users and Existing Records
    const [users, existingRecords] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        include: { feeConfig: true },
      }),
      prisma.feeRecord.findMany({
        where: {
          userId: { in: userIds },
          month,
          year,
        },
      }),
    ]);

    const recordMap = new Map();
    existingRecords.forEach((r) => recordMap.set(r.userId, r));

    // 2. Process payments serially to ensure stability on Vercel db connections
    for (const user of users) {
      let record = recordMap.get(user.id);

      // Create if not exists
      if (!record) {
        const amount = user.feeConfig?.amount || 0;
        if (amount > 0) {
          record = await prisma.feeRecord.create({
            data: {
              userId: user.id,
              month,
              year,
              amount,
              status: "PENDING",
            },
          });
        }
      }

      // Pay if record exists and need payment
      if (record && record.status !== "PAID") {
        const due = record.amount - record.paidAmount;
        if (due > 0) {
          await recordPayment(
            user.id,
            due,
            "CASH", // Default to CASH for bulk admin actions
            `Bulk Paid by ${adminName}`,
            `Payment for ${monthName} ${year}`,
            undefined,
            record.id,
          );
          count++;
        }
      }
    }

    revalidatePath("/admin/fees");
    revalidatePath("/fees");
    return { success: true, count };
  } catch (error) {
    console.error("Error in bulkMarkFeePaid:", error);
    return { success: false, error: "Failed to process bulk payments" };
  }
}

/**
 * Fetch grouped event funds (for Card View)
 */
export async function getGroupedEvents() {
  try {
    const events = await prisma.eventContribution.groupBy({
      by: ["title"],
      _sum: {
        amount: true,
        paidAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // We also need one instance to get the default amount (assuming uniform initially)
    // Or we can just use the average or first found.
    // Let's fetch one record per title to get the "default" amount metadata if needed.
    // For simplicity, we'll return the aggregate data.

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching grouped events:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

/**
 * Fetch all details for a specific event title
 */
export async function getEventDetails(title: string) {
  try {
    const contributions = await prisma.eventContribution.findMany({
      where: { title },
      include: {
        user: { select: { name: true, username: true } },
      },
      orderBy: { user: { name: "asc" } },
    });
    return { success: true, data: contributions };
  } catch (error) {
    console.error("Error fetching event details:", error);
    return { success: false, error: "Failed to fetch event details" };
  }
}

/**
 * Bulk Update Event (Title and/or Amount)
 */
export async function updateBulkEvent(
  oldTitle: string,
  newTitle: string,
  newAmount: number,
) {
  try {
    // Update all records with the old title
    // Note: This changes amount for everyone. Alternatively, we could only change for those who haven't paid?
    // User said "if edited, has to be edited for everyone".
    await prisma.eventContribution.updateMany({
      where: { title: oldTitle },
      data: {
        title: newTitle,
        amount: newAmount,
        // We do NOT reset paidAmount.
        // We might need to update status if newAmount > paidAmount.
        // Prisma updateMany doesn't allow dynamic value based on current values easily for status in one go without raw query.
        // But for status, we can do a second pass or raw query.
        // For now, let's just update title and amount. Status update is tricky in bulk without logic.
      },
    });

    // Fix statuses
    // This part is heavy but ensures consistency.
    // "updateMany" doesn't support "set status based on new amount vs existing paidAmount".
    // We can iterate or use raw SQL. Given user count (likely < 1000), iteration or raw is fine.
    // Let's use a quick raw query or just leave status as is? No, status must be correct.
    // Let's use findMany then updateMany for chunks to fixing status?
    // Actually, let's keep it simple: Status is derived.

    // Optimized Status Update (3 queries vs N queries)
    // 1. Set PAID where paidAmount >= newAmount
    const p1 = prisma.eventContribution.updateMany({
      where: { title: newTitle, paidAmount: { gte: newAmount } },
      data: { status: "PAID" },
    });

    // 2. Set PARTIAL where paidAmount > 0 AND paidAmount < newAmount
    const p2 = prisma.eventContribution.updateMany({
      where: { title: newTitle, paidAmount: { gt: 0, lt: newAmount } },
      data: { status: "PARTIAL" },
    });

    // 3. Set PENDING where paidAmount == 0
    const p3 = prisma.eventContribution.updateMany({
      where: { title: newTitle, paidAmount: 0 },
      data: { status: "PENDING" },
    });

    await Promise.all([p1, p2, p3]);

    revalidatePath("/admin/fees");
    revalidatePath("/fees");
    return { success: true };
  } catch (error) {
    console.error("Error updating bulk event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Bulk Delete Event
 */
export async function deleteBulkEvent(title: string) {
  try {
    // Check if any have payments
    const hasPayments = await prisma.eventContribution.findFirst({
      where: {
        title,
        paidAmount: { gt: 0 },
      },
    });

    if (hasPayments) {
      return {
        success: false,
        error: "Cannot delete event. Some members have already paid.",
      };
    }

    await prisma.eventContribution.deleteMany({
      where: { title },
    });

    revalidatePath("/admin/fees");
    revalidatePath("/fees");
    return { success: true };
  } catch (error) {
    console.error("Error deleting bulk event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
