import { Topbar } from "@/components/layout/Topbar";
import { SettingsSubNav } from "@/components/settings/SettingsSubNav";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Topbar title="Configurações" />
      <SettingsSubNav />
      {children}
    </div>
  );
}
