import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";

export default function AgendarIndexPage() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
        <LinkIcon className="w-8 h-8 text-brand-400" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Link inválido</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Para agendar, acesse o link personalizado da sua profissional. Ele tem o formato:{" "}
        <span className="font-mono text-brand-600">/agendar/nome-do-salao</span>
      </p>
      <Link href="/login">
        <Button variant="outline">Entrar na plataforma</Button>
      </Link>
    </div>
  );
}
