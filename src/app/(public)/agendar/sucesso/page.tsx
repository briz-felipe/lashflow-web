import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, MessageCircle } from "lucide-react";

export default function AgendarSucessoPage() {
  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-3">
        Solicitação Enviada!
      </h1>
      <p className="text-muted-foreground mb-8">
        Seu agendamento foi solicitado com sucesso. A profissional irá confirmar
        seu horário em breve.
      </p>

      <div className="bg-brand-50 rounded-2xl p-6 mb-8 border border-brand-200 text-left space-y-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-800">Próximo passo</p>
            <p className="text-sm text-muted-foreground">
              Você receberá uma confirmação assim que a profissional aprovar o horário.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-800">Lembrete</p>
            <p className="text-sm text-muted-foreground">
              Salve o número para receber notificações sobre seu agendamento.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/agendar">
          <Button variant="outline" className="w-full">
            Fazer novo agendamento
          </Button>
        </Link>
        <Link href="/minha-conta">
          <Button className="w-full">
            Acessar minha conta
          </Button>
        </Link>
      </div>
    </div>
  );
}
