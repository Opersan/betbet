import { MobileSceneLayout } from "@/components/layout/MobileSceneLayout";
import { PremiumCard } from "@/components/ui/PremiumCard";

export default function Home() {
  return (
    <MobileSceneLayout
      title="Bugün sadece doğum günün değil..."
      subtitle="Bizim hikayemizin de özel bir günü."
      backgroundVariant="night"
      progress={{ current: 1, total: 3 }}
      primaryAction={{
        label: "Yolculuğa Başla",
        href: "/unlock",
      }}
    >
      <div className="flex w-full flex-1 items-center">
        <PremiumCard className="w-full p-6">
          <div className="mb-5 inline-flex rounded-full border border-[#f4dcc0]/25 bg-[#f4dcc0]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f4dcc0]">
            20 Temmuz
          </div>

          <div className="space-y-4">
            <p className="text-[2.65rem] font-semibold leading-[0.98] tracking-normal text-[#fffaf2]">
              Sana hazırladığım küçük bir gece.
            </p>
            <p className="max-w-[22rem] text-base leading-7 text-[#fffaf2]/72">
              Bazı günler takvimde bir tarih olmaktan çıkar. Bu da onlardan biri.
            </p>
          </div>
        </PremiumCard>
      </div>
    </MobileSceneLayout>
  );
}
