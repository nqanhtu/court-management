"use server";

import { db } from "@/lib/db";
import { BorrowSlip } from "@prisma/client";

export async function getBorrowSlips() {
  try {
    const borrowSlips = await db.borrowSlip.findMany({
      include: {
        user: true,
        items: {
          include: {
            file: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return borrowSlips;
  } catch (error) {
    console.error("Error fetching borrow slips:", error);
    return [];
  }
}

export async function getBorrowSlip(id: string) {
  try {
    const borrowSlip = await db.borrowSlip.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            file: true,
          },
        },
      },
    });
    return borrowSlip;
  } catch (error) {
    console.error("Error fetching borrow slip:", error);
    return null;
  }
}

export async function getReportStats() {
  try {
    const totalBorrows = await db.borrowSlip.count();
    
    // Assuming status "BORROWING" or returnDate is null means active
    const activeBorrows = await db.borrowSlip.count({
      where: {
        status: {
          in: ["BORROWING", "OVERDUE"] 
        }
      }
    });

    const overdueBorrows = await db.borrowSlip.count({
      where: {
        OR: [
          { status: "OVERDUE" },
          { 
            status: "BORROWING",
            dueDate: { lt: new Date() }
          }
        ]
      }
    });

    const returnedCount = await db.borrowSlip.count({
      where: { status: "RETURNED" }
    });

    const returnedRate = totalBorrows > 0 ? Math.round((returnedCount / totalBorrows) * 100) : 0;

    const recentBorrows = await db.borrowSlip.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            file: true,
          }
        }
      }
    });

    return {
      totalBorrows,
      activeBorrows,
      overdueBorrows,
      returnedRate,
      recentBorrows
    };
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return {
      totalBorrows: 0,
      activeBorrows: 0,
      overdueBorrows: 0,
      returnedRate: 0,
      recentBorrows: []
    };
  }
}
