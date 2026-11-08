"use server";

import { prisma } from "@/lib/db";
import { fetchBridgeEvents } from "@/lib/jamatevents-api";
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

      case "EVENTS": {
        const [bridgeEvents, attendanceCounts] = await Promise.all([
          fetchBridgeEvents({ order: "desc" }),
          prisma.attendanceRecord.groupBy({
            by: ["eventId"],
            _count: { userId: true },
          }),
        ]);
        const countMap = new Map(
          attendanceCounts.map((c) => [c.eventId, c._count.userId]),
        );
        data = bridgeEvents.map((e) => ({
          Name: e.name,
          Occasion: e.description,
          Date: e.occasionDate,
          Time: e.occasionTime,
          Type: e.eventType,
          "Hall(s)": e.hall.join(", "),
          "Total Guests": e.thaalCount * 8,
          "Attendees Marked": countMap.get(e.id) || 0,
          Status: e.status,
        }));
        break;
      }

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

      case "PENDING_FEES": {
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

        const allUsers = await prisma.user.findMany({
          orderBy: { name: "asc" },
          select: {
            name: true,
            its: true,
            username: true,
            feeRecords: true,
          },
        });

        data = allUsers.map((user) => {
          const row: any = {
            "User Name": user.name || user.username || "Unknown",
            ITS: user.its || "-",
            "Total Due": 0,
          };

          let totalUserDue = 0;

          const userRecordMap = new Map();
          user.feeRecords.forEach((r) => {
            const key = new Date(r.year, r.month).toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
            userRecordMap.set(key, r);
          });

          dynamicHeaders.forEach((header) => {
            const record = userRecordMap.get(header);
            if (record) {
              const due = record.amount - record.paidAmount;
              row[header] = due;
              totalUserDue += due;
            } else {
              row[header] = 0;
            }
          });

          row["Total Due"] = totalUserDue;
          return row;
        });
        break;
      }

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
