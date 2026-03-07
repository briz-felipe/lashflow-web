"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClient, useClients } from "@/hooks/useClients";
import { toast } from "@/components/ui/toaster";
import { fetchCep, formatCep } from "@/lib/cep";
import { ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { LoadingPage } from "@/components/shared/LoadingSpinner";

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { client, loading } = useClient(id);
  const { updateClient } = useClients();
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

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        phone: client.phone,
        email: client.email ?? "",
        instagram: client.instagram ?? "",
        birthday: client.birthday ?? "",
        zipCode: client.address?.zipCode ?? "",
        street: client.address?.street ?? "",
        neighborhood: client.address?.neighborhood ?? "",
        city: client.address?.city ?? "",
        state: client.address?.state ?? "",
        notes: client.notes ?? "",
      });
    }
  }, [client]);

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
    setSaving(true);
    try {
      const hasAddress = form.city || form.street || form.zipCode;
      await updateClient(id, {
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
      toast({ title: "Dados atualizados!", variant: "success" });
      router.push(`/clientes/${id}`);
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Topbar title="Editar Cliente" />
      <div className="p-4 sm:p-6 max-w-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/clientes/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Editar: {client?.name}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dados Básicos */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" value={form.name} onChange={setField("name")} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" value={form.phone} onChange={setField("phone")} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="birthday">Data de Nascimento</Label>
                <Input id="birthday" type="date" value={form.birthday} onChange={setField("birthday")} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={setField("email")} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" value={form.instagram} onChange={setField("instagram")} placeholder="@usuario" className="mt-1.5" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 sm:p-6">
            <h2 className="font-semibold mb-4 text-brand-700 text-sm">Endereço</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CEP — triggers auto-fill */}
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
                  <p className="text-xs text-emerald-600 mt-1">Endereço preenchido automaticamente</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">Estado (UF)</Label>
                <Input id="state" value={form.state} onChange={setField("state")} placeholder="SP" maxLength={2} className="mt-1.5 uppercase" />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={form.city} onChange={setField("city")} placeholder="Cidade" className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" value={form.neighborhood} onChange={setField("neighborhood")} placeholder="Bairro" className="mt-1.5" />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="street">Rua / Logradouro</Label>
                <Input id="street" value={form.street} onChange={setField("street")} placeholder="Rua, número, complemento" className="mt-1.5" />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" value={form.notes} onChange={setField("notes")} rows={3} className="mt-1.5" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/clientes/${id}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving} className="flex-1">
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
