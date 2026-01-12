import { getBorrowSlips } from "@/lib/actions/borrows";
import BorrowClient from "./BorrowClient";

export default async function BorrowPage() {
  const borrowSlips = await getBorrowSlips();
  
  return <BorrowClient initialBorrowSlips={borrowSlips} />;
}