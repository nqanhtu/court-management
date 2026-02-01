
import 'dotenv/config';
import { db } from './lib/db';

const payload = {
  borrowerName: 'Trần Văn B (Thẩm phán)',
  borrowerUnit: 'Tòa Hình sự',
  borrowerTitle: '',
  reason: '',
  dueDate: new Date('2026-02-07T00:00:00.000Z'),
  fileIds: [ '802ea934-a704-4a61-813a-d9417c98a56f' ]
};

async function check() {
    console.log("--- 1. Checking Lender (User) ---");
    const lender = await db.user.findFirst();
    if (!lender) {
        console.error("ERROR: No user found in DB to act as lender.");
        return;
    }
    console.log(`User OK: ${lender.username} (${lender.id})`);

    console.log("\n--- 2. Checking Files ---");
    const files = await db.file.findMany({ where: { id: { in: payload.fileIds } } });
    
    if (files.length === 0) {
        console.error("ERROR: No files found with IDs:", payload.fileIds);
        return;
    }
    
    let hasStatusError = false;
    files.forEach(f => {
        console.log(`File: ${f.code}`);
        console.log(`   ID: ${f.id}`);
        console.log(`   Status: ${f.status}`);
        
        if (f.status !== 'IN_STOCK') {
            console.error(`   => ERROR: File ${f.code} is not IN_STOCK (Current: ${f.status}). Cannot create borrow slip.`);
            hasStatusError = true;
        }
    });

    if (hasStatusError) {
        console.log("\nCONCLUSION: The borrowing fails because one or more files are not IN_STOCK.");
        return;
    }

    console.log("\n--- 3. Simulating Borrow Slip Creation ---");
    try {
        await db.$transaction(async (tx) => {
             // 1. Check & Lock Files
             // This mimics exactly what the Server Action does
             const updatedBatch = await tx.file.updateMany({
                where: { 
                    id: { in: payload.fileIds }, 
                    status: 'IN_STOCK' 
                },
                data: { status: 'BORROWED' }
             });
             
             console.log(`Updated ${updatedBatch.count} files.`);

             if (updatedBatch.count !== payload.fileIds.length) {
                 throw new Error("Update count mismatch! Some files were not IN_STOCK during transaction.");
             }
             
             // 2. Create Slip
             const slipCode = `TEST-${Date.now()}`;
             const newSlip = await tx.borrowSlip.create({
                 data: {
                    code: slipCode,
                    borrowerName: payload.borrowerName,
                    borrowerUnit: payload.borrowerUnit,
                    borrowerTitle: payload.borrowerTitle,
                    reason: payload.reason,
                    dueDate: payload.dueDate,
                    lenderId: lender.id,
                    status: 'BORROWING',
                    items: {
                        create: payload.fileIds.map(fid => ({
                            fileId: fid,
                            status: 'BORROWING'
                        }))
                    }
                 }
             });
             
             console.log("Slip created successfully in transaction:", newSlip.code);

             // Force Rollback to keep DB clean
             throw new Error("ROLLBACK_TEST_SUCCESS"); 
        });
    } catch (e: any) {
        if (e.message === "ROLLBACK_TEST_SUCCESS") {
            console.log("\nSUCCESS: The logic works correctly! (Transaction rolled back to preserve state)");
        } else {
            console.error("\nFAILURE: Transaction failed with error:", e);
        }
    } finally {
        // await db.$disconnect();
    }
}

check();
