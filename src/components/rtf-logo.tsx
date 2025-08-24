
import { cn } from "@/lib/utils";
import Image from "next/image";

export function RtfLogo(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md overflow-hidden",
        props.className
      )}
      {...props}
    >
      <Image src="/logo.jpg" alt="Raghav Tailors & Fabrics Logo" width={96} height={96} className="object-cover"/>
    </div>
  );
}
