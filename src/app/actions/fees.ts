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
    const users = await prisma.user.findMany({
      include: { feeConfig: true },
    });

    const records = [];
    let count = 0;

    for (const user of users) {
      // Check if record exists
      const existing = await prisma.feeRecord.findUnique({
        where: {
          userId_month_year: {
            userId: user.id,
            month,
            year,
          },
        },
      });

      if (!existing) {
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

    // Batch create using createMany is faster, but we built array for flexibility
    if (records.length > 0) {
      await prisma.feeRecord.createMany({
        // @ts-ignore - Prisma createMany types can be tricky with enums sometimes or if strict mode
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
      await prisma.eventContribution.createMany({
        data,
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
