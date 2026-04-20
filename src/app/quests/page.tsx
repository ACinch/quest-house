import AppShell from "@/components/AppShell";
import QuestsView from "@/components/views/QuestsView";
import ParentOnly from "@/components/ParentOnly";

export default function QuestsPage() {
  return (
    <AppShell>
      <ParentOnly message="Custom quests are a parent-only tool.">
        <QuestsView />
      </ParentOnly>
    </AppShell>
  );
}
