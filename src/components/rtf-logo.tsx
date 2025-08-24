
import { cn } from "@/lib/utils";
import Image from "next/image";

export function RtfLogo(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-headline font-bold text-2xl bg-primary text-primary-foreground rounded-md",
        props.className
      )}
      {...props}
    >
      RTF
    </div>
  );
}
