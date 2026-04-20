import AppShell from "@/components/AppShell";
import ChestPoolView from "@/components/views/ChestPoolView";
import ParentOnly from "@/components/ParentOnly";

export default function ChestPoolPage() {
  return (
    <AppShell>
      <ParentOnly message="Only parents can edit the chest reward pool. Winter's rewards are a surprise!">
        <ChestPoolView />
      </ParentOnly>
    </AppShell>
  );
}
