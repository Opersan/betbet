import { Lock } from "lucide-react";
import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { JourneyPreviewClient } from "./JourneyPreviewClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ token?: string | string[]; code?: string | string[] }>;

export default async function JourneyPreviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = firstParam(params.token);
  const code = firstParam(params.code) ?? "20TEMMUZ";
  const access = getPreviewAccess(token);
  const previewToken = token ?? `${code}-PREVIEW`;

  if (!access.allowed) {
    return (
      <MobileSceneLayout
        title="Preview kilitli"
        subtitle="Bu endpoint gizli sahne içeriğini gösterir."
        backgroundVariant="deep"
      >
        <PremiumCard className="w-full p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#f4dcc0]/20 bg-[#f4dcc0]/10 text-[#f4dcc0]">
            <Lock size={21} strokeWidth={1.7} />
          </div>
          <p className="text-lg leading-8 text-[#fffaf2]/78">{access.message}</p>
          <p className="mt-4 text-sm leading-6 text-[#fffaf2]/54">
            Production kullanımı: `JOURNEY_PREVIEW_TOKEN` env ekle, sonra `/journey/preview?token=...`
            ile aç.
          </p>
        </PremiumCard>
      </MobileSceneLayout>
    );
  }

  return <JourneyPreviewClient code={code} previewToken={previewToken} />;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPreviewAccess(token: string | undefined) {
  const configuredToken = process.env.JOURNEY_PREVIEW_TOKEN;

  if (configuredToken) {
    return token === configuredToken
      ? { allowed: true, message: "Preview açık." }
      : { allowed: false, message: "Preview token hatalı veya eksik." };
  }

  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, message: "Local geliştirme preview modu açık." };
  }

  return {
    allowed: false,
    message: "Production'da preview için JOURNEY_PREVIEW_TOKEN env tanımlanmalı.",
  };
}
