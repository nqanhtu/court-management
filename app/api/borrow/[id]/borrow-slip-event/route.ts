import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        const denied = requirePermission(session, "viewBorrow");
        if (denied) return denied;

        const events = await db.borrowSlipEvent.findMany({
            where: {
                borrowSlipId: id,
            },
            include: {
                creator: {
                    select: {
                        fullName: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Get Borrow Events Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();
        const denied = requirePermission(session, "manageBorrow");
        if (denied) return denied;

        const body = await request.json();
        const { eventType, description, details } = body;

        if (!eventType) {
            return NextResponse.json(
                { error: "eventType is required" },
                { status: 400 }
            );
        }

        const event = await db.borrowSlipEvent.create({
            data: {
                borrowSlipId: id,
                eventType,
                description,
                details: details ? details : undefined,
                creatorId: session!.id,
            },
        });

        return NextResponse.json({ success: true, event });
    } catch (error) {
        console.error("Create Borrow Event Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
