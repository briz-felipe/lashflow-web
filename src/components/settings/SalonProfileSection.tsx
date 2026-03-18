"use client";

import { useState, useEffect } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { integrationsService } from "@/services/api/ApiIntegrationsService";

export function SalonProfileSection() {
  const { user, reloadProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.salonName ?? "");
      setSlug(user.salonSlug ?? "");
      setAddress(user.salonAddress ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await integrationsService.updateProfile({
        salonName: name || undefined,
        salonSlug: slug || undefined,
        salonAddress: address || undefined,
      });
      await reloadProfile();
      toast({ title: "Perfil atualizado!", variant: "success" });
    } catch {
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-50 flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
          <Store className="w-4 h-4 text-brand-600" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Perfil do Salão</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Nome, endereço e identidade da sua plataforma</p>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nome do salão</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Studio Bella Lash"
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">Aparece no menu lateral no lugar de "LashFlow"</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Apelido / slug</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex-shrink-0">lashflow.com/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="studio-bella"
              className="h-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Identificador único no sistema (apenas letras, números e hífens)</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Endereço / localização</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Rua das Flores, 123 – São Paulo, SP"
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">Usado como localização nos eventos do Apple Calendar</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </div>
  );
}
