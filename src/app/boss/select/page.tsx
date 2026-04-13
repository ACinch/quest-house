import AppShell from "@/components/AppShell";
import ParentOnly from "@/components/ParentOnly";
import BossSelectView from "@/components/views/BossSelectView";

export default function BossSelectPage() {
  return (
    <AppShell>
      <ParentOnly message="Only parents can pick this week's boss.">
        <BossSelectView />
      </ParentOnly>
    </AppShell>
  );
}
