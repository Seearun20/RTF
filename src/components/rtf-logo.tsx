import { cn } from "@/lib/utils";
import Image from "next/image";

export function RtfLogo(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md",
        props.className
      )}
      {...props}
    >
      <Image
        src="/logo.jpg"   // path inside public/
        alt="RTF Logo"
        width={120}       // adjust to your needs
        height={120}
        className="object-contain"
      />
    </div>
  );
}
