import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: { id: string; name: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn("relative", stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "")}
          >
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary transition-colors">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="absolute mt-2 block text-center w-full text-sm text-foreground">{step.name}</span>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
                 <span className="absolute mt-2 block text-center w-full text-sm font-medium text-primary">{step.name}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background">
                </div>
                <span className="absolute mt-2 block text-center w-full text-sm text-muted-foreground">{step.name}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
