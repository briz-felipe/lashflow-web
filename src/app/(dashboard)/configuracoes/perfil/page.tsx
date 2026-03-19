"use client";

import { useState, useEffect } from "react";
import { SalonProfileSection } from "@/components/settings/SalonProfileSection";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { Link2, Copy, Check, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function PerfilPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const slug = user?.salonSlug ?? user?.username ?? null;
  const publicLink = slug ? `${origin}/agendar/${slug}` : null;

  const copyLink = () => {
    if (!publicLink) return;
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
            <p className="text-xs text-muted-foreground mt-0.5">
              Link exclusivo do seu salão para as clientes agendarem
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {!user?.salonSlug ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Configure seu apelido/slug</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Defina um apelido exclusivo no <strong>Perfil do Salão</strong> acima para ter
                  um link personalizado. Até lá, seu link usa o nome de usuário ({user?.username}).
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Compartilhe com suas clientes para que elas solicitem horários sem precisar entrar em contato.
            </p>
          )}

          {publicLink && origin ? (
            <>
              <Link
                href={publicLink}
                target="_blank"
                className="block p-3 bg-brand-50 rounded-xl border border-brand-100 font-mono text-xs text-brand-700 break-all hover:bg-brand-100 transition-colors"
              >
                {publicLink}
              </Link>
              <Button className="w-full" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Link copiado!" : "Copiar link"}
              </Button>
            </>
          ) : (
            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 font-mono text-xs text-brand-300">
              {origin}/agendar/<span className="text-brand-400 italic">seu-slug</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
