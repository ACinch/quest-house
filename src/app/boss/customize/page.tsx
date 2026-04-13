import AppShell from "@/components/AppShell";
import ParentOnly from "@/components/ParentOnly";
import BossCustomizeView from "@/components/views/BossCustomizeView";

export default function BossCustomizePage() {
  return (
    <AppShell>
      <ParentOnly message="Only parents can customize the boss task list.">
        <BossCustomizeView />
      </ParentOnly>
    </AppShell>
  );
}
