"use server";

import { prisma } from "@/lib/db";
import { requireAccess } from "@/lib/access-control";

export async function getExportData(type: string) {
  const { authorized } = await requireAccess("/admin/exports");
  if (!authorized) return { success: false, error: "Unauthorized" };

  try {
    let data: any[] = [];
    let headers: string[] | undefined;

    switch (type) {
      case "USERS":
        data = await prisma.user.findMany({
          orderBy: { name: "asc" },
          select: {
            its: true,
            name: true,
            username: true,
            mobile: true,
            email: true,
            role: true,
            profileStatus: true,
            createdAt: true,
            dob: true,
            quranHifz: true,
            passport: true,
            kunSafar: true,
            occupation: true,
            sports: true,
            feeConfig: {
              select: { amount: true },
            },
          },
        });
        // Flatten feeConfig and calculate age
        data = data.map((u) => {
          const age = u.dob
            ? Math.floor(
                (Date.now() - new Date(u.dob).getTime()) /
                  (1000 * 60 * 60 * 24 * 365.25),
              )
            : null;
          return {
            ...u,
            age,
            monthlyFee: u.feeConfig?.amount || 0,
            feeConfig: undefined,
          };
        });
        break;

      case "ACCOUNTS":
        // Ledger / Transactions
        data = await prisma.feeTransaction.findMany({
          orderBy: { date: "desc" },
          include: {
            user: {
              select: { name: true, its: true },
            },
          },
        });
        data = data.map((tx) => ({
          Date: tx.date,
          "User Name": tx.user.name,
          ITS: tx.user.its,
          Amount: tx.amount,
          Mode: tx.mode,
          Reference: tx.reference,
          Note: tx.note,
          "Created At": tx.createdAt,
        }));
        break;

      case "EVENTS":
        // Master Events List with Attendance Summary
        data = await prisma.event.findMany({
          orderBy: { occasionDate: "desc" },
          include: {
            _count: {
              select: { attendanceRecords: true },
            },
          },
        });
        data = data.map((e) => ({
          Name: e.name,
          Date: e.occasionDate,
          Type: e.eventType,
          "Hall(s)": e.hall.join(", "),
          "Total Guests": e.thaalCount * 8, // Estimate or just use other fields
          "Attendees Marked": e._count.attendanceRecords,
          Status: e.status,
        }));
        break;

      case "CONTRIBUTIONS":
        data = await prisma.eventContribution.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, its: true } },
          },
        });
        data = data.map((c) => ({
          "Event Title": c.title,
          "User Name": c.user.name,
          ITS: c.user.its,
          Amount: c.amount,
          "Paid Amount": c.paidAmount,
          Status: c.status,
          "Created At": c.createdAt,
        }));
        break;

      case "PENDING_FEES":
      case "PENDING_FEES":
        // 1. Get all unique billing months globally to align columns
        const distinctMonths = await prisma.feeRecord.groupBy({
          by: ["month", "year"],
          orderBy: [{ year: "asc" }, { month: "asc" }],
        });

        const dynamicHeaders = distinctMonths.map((m) =>
          new Date(m.year, m.month).toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
        );

        headers = ["User Name", "ITS", "Total Due", ...dynamicHeaders];

        // 2. Get All Users with their records
        const allUsers = await prisma.user.findMany({
          orderBy: { name: "asc" },
          select: {
            name: true,
            its: true,
            username: true,
            feeRecords: true,
          },
        });

        // 3. Map Data
        data = allUsers.map((user) => {
          const row: any = {
            "User Name": user.name || user.username || "Unknown",
            ITS: user.its || "-",
            "Total Due": 0,
          };

          let totalUserDue = 0;

          // Pre-process user records for easier lookup
          const userRecordMap = new Map();
          user.feeRecords.forEach((r) => {
            const key = new Date(r.year, r.month).toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
            userRecordMap.set(key, r);
          });

          // Fill columns
          dynamicHeaders.forEach((header) => {
            const record = userRecordMap.get(header);
            if (record) {
              const due = record.amount - record.paidAmount;
              row[header] = due;
              totalUserDue += due;
            } else {
              row[header] = 0; // No record implies 0 due
            }
          });

          row["Total Due"] = totalUserDue;
          return row;
        });
        break;

      case "PAID_HISTORY":
        data = await prisma.feeRecord.findMany({
          where: { status: "PAID" },
          orderBy: { updatedAt: "desc" },
          include: {
            user: { select: { name: true, its: true } },
          },
        });
        data = data.map((f) => ({
          "User Name": f.user.name,
          ITS: f.user.its,
          Month: f.month + 1,
          Year: f.year,
          Amount: f.amount,
          "Paid Date": f.updatedAt,
        }));
        break;

      default:
        return { success: false, error: "Invalid Export Type" };
    }

    return { success: true, data, headers };
  } catch (error: any) {
    console.error("Export error:", error);
    return { success: false, error: "Failed to fetch export data" };
  }
}
