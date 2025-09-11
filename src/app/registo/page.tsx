
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { createCompanyForNewUser } from "@/lib/storage";


const registerSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // ETAPA CRÍTICA: Criar o documento da empresa no Firestore
      await createCompanyForNewUser(user.uid);
      
      toast({
        title: "Registo bem-sucedido!",
        description: "A sua conta foi criada. A redirecionar...",
      });
      router.push("/"); // Redirecionar para a página principal após o registo bem-sucedido

    } catch (error: any) {
      console.error("Firebase registration error:", error);
      let description = "Ocorreu um erro desconhecido. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este endereço de e-mail já está a ser utilizado por outra conta.";
      }
      toast({
        title: "Erro no Registo",
        description: description,
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
      <div className="absolute top-8 left-8">
         <Logo />
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Crie a Sua Conta Solaris</CardTitle>
          <CardDescription>
            É rápido e fácil. Vamos começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...form.register("email")}
                autoComplete="email"
              />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Pelo menos 6 caracteres"
                {...form.register("password")}
                autoComplete="new-password"
              />
               {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                 <UserPlus className="mr-2"/> Criar Conta
                </>
              )}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                Já tem uma conta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Faça login
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
