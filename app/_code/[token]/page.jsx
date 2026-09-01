import "@/app/_legacy-platform.css";
import { notFound } from "next/navigation";
import { getCoderProject } from "@/lib/db";
import CodingWorkspace from "./workspace";

export const dynamic = "force-dynamic";

export default async function CodePage({ params }) {
  const { token } = await params;
  const data = await getCoderProject(token);
  if (!data) notFound();

  return <CodingWorkspace token={token} data={data} />;
}

