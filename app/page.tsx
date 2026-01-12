import { getFiles } from "@/lib/actions/files";
import HomeClient from "./HomeClient";

export default async function Home() {
  const files = await getFiles();
  return <HomeClient initialFiles={files} />;
}