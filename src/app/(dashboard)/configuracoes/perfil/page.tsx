"use client";

import { useState, useEffect } from "react";
import { SalonProfileSection } from "@/components/settings/SalonProfileSection";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { Link2, Copy, Check } from "lucide-react";

export default function PerfilPage() {
  const [copied, setCopied] = useState(false);
  const [publicLink, setPublicLink] = useState("/agendar");

  useEffect(() => {
    setPublicLink(`${window.location.origin}/agendar`);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!", variant: "success" });
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in max-w-2xl space-y-6">
      <SalonProfileSection />

      {/* Public booking link */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-50 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 flex-shrink-0">
            <Link2 className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Link de Agendamento</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Compartilhe com suas clientes</p>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Suas clientes podem solicitar horários diretamente por este link, sem precisar entrar em contato.
          </p>
          <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 font-mono text-xs text-brand-700 break-all">
            {publicLink}
          </div>
          <Button className="w-full" onClick={copyLink}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Link copiado!" : "Copiar link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
