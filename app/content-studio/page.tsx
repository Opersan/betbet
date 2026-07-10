import { notFound } from "next/navigation";
import { ContentStudio } from "@/components/content-studio/ContentStudio";

export const dynamic = "force-dynamic";

export default function ContentStudioPage() {
  if (process.env.NEXT_PUBLIC_CONTENT_STUDIO_ENABLED !== "true") {
    notFound();
  }

  return <ContentStudio />;
}
