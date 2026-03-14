"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { toast } from "@/components/ui/toaster";
import { fetchCep, formatCep } from "@/lib/cep";
import { ArrowLeft, Save, User, Phone, Mail, Instagram, MapPin, Cake, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NovoClientePage() {
  const router = useRouter();
  const { createClient } = useClients();
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFilled, setCepFilled] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    birthday: "",
    zipCode: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
  });

  const setField = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm((prev) => ({ ...prev, zipCode: formatted }));
    setCepFilled(false);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const addr = await fetchCep(digits);
      setForm((prev) => ({
        ...prev,
        street: addr.street || prev.street,
        neighborhood: addr.neighborhood || prev.neighborhood,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
      }));
      setCepFilled(true);
    } catch {
      toast({ title: "CEP não encontrado", description: "Verifique o CEP e tente novamente.", variant: "destructive" });
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Campos obrigatórios", description: "Nome e telefone são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const hasAddress = form.city || form.street || form.zipCode;
      const client = await createClient({
        name: form.name,
        phone: form.phone.replace(/\D/g, ""),
        email: form.email || undefined,
        instagram: form.instagram.replace("@", "") || undefined,
        birthday: form.birthday || undefined,
        address: hasAddress
          ? {
              zipCode: form.zipCode || undefined,
              street: form.street || undefined,
              neighborhood: form.neighborhood || undefined,
              city: form.city || undefined,
              state: form.state || undefined,
            }
          : undefined,
        notes: form.notes || undefined,
      });
      toast({ title: "Cliente cadastrada!", description: `${client.name} foi adicionada com sucesso.`, variant: "success" });
      router.push(`/clientes/${client.id}`);
    } catch (err) {
      console.error("[novo-cliente] createClient:", err);
      toast({ title: "Erro ao cadastrar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Nova Cliente" />

      <div className="p-4 sm:p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Nova Cliente</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Cards em grid: 1 col mobile → 2 col lg → 3 col xl */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">

            {/* ── Col 1: Dados Básicos ── */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
              <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                <User className="w-4 h-4" /> Dados Básicos
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={setField("name")}
                    placeholder="Nome da cliente"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Telefone *
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={setField("phone")}
                    placeholder="(11) 99999-9999"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birthday" className="flex items-center gap-1.5">
                    <Cake className="w-3 h-3" /> Data de Nascimento
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={form.birthday}
                    onChange={setField("birthday")}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* ── Col 2: Contato Digital + Observações ── */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                  <Mail className="w-4 h-4" /> Contato Digital
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={setField("email")}
                      placeholder="email@exemplo.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram" className="flex items-center gap-1.5">
                      <Instagram className="w-3 h-3" /> Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={form.instagram}
                      onChange={setField("instagram")}
                      placeholder="@usuario"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                <Label htmlFor="notes" className="text-base font-semibold text-brand-700">Observações</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={setField("notes")}
                  placeholder="Anotações sobre a cliente, preferências, alergias..."
                  className="mt-2"
                  rows={5}
                />
              </div>
            </div>

            {/* ── Col 3: Endereço ── */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8 lg:col-span-2 xl:col-span-1">
              <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                <MapPin className="w-4 h-4" /> Endereço
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode" className="flex items-center gap-1.5">
                      CEP
                      {cepLoading && <Loader2 className="w-3 h-3 animate-spin text-brand-500" />}
                      {cepFilled && !cepLoading && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    </Label>
                    <Input
                      id="zipCode"
                      value={form.zipCode}
                      onChange={handleZipCodeChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="mt-1.5"
                    />
                    {cepFilled && (
                      <p className="text-xs text-emerald-600 mt-1">Preenchido automaticamente</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input
                      id="state"
                      value={form.state}
                      onChange={setField("state")}
                      placeholder="SP"
                      maxLength={2}
                      className="mt-1.5 uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={setField("city")}
                      placeholder="Cidade"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={form.neighborhood}
                      onChange={setField("neighborhood")}
                      placeholder="Bairro"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="street">Rua / Logradouro</Label>
                  <Input
                    id="street"
                    value={form.street}
                    onChange={setField("street")}
                    placeholder="Rua, número, complemento"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions — barra full-width */}
          <div className="flex gap-3 justify-end">
            <Link href="/clientes">
              <Button type="button" variant="outline" className="h-11 px-8">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="h-11 px-8">
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Cadastrar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
