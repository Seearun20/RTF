
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { sendOtp } from "@/ai/flows/send-otp-flow";

interface Signatory {
    id: string;
    name: string;
    email: string;
}

const PROPRIETOR_EMAIL = "seearun20@gmail.com";

const LoginSchema = z.object({
  role: z.string().min(1, "Please select a role."),
  email: z.string().email("Please enter a valid email address."),
}).refine(data => {
    if (data.role === 'proprietor' && data.email.toLowerCase() !== PROPRIETOR_EMAIL) {
        return false;
    }
    return true;
}, {
    message: `Email for proprietor must be ${PROPRIETOR_EMAIL}`,
    path: ["email"],
});


const OTPSchema = z.object({
  otp: z.string().min(6, { message: "Your OTP must be 6 characters." }),
});

function EmailStep({ onEmailSubmit }: { onEmailSubmit: (email: string, otp: string) => void; }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "signatories"), (snapshot) => {
        const signatoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signatory));
        setSignatories(signatoriesData);
    });
    return () => unsubscribe();
  }, []);


  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { role: "", email: "" },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    const selectedSignatory = signatories.find(s => s.email === watchedRole);
    if (watchedRole === "proprietor") {
      form.setValue("email", PROPRIETOR_EMAIL);
    } else if (selectedSignatory) {
        form.setValue("email", selectedSignatory.email);
    } else {
        form.setValue("email", "");
    }
  }, [watchedRole, form, signatories]);


  const handleSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setIsSubmitting(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const result = await sendOtp({ email: values.email, otp });
      if (result.success) {
        toast({
          title: "OTP Sent!",
          description: `An OTP has been sent to ${values.email}.`,
        });
        onEmailSubmit(values.email, otp);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send OTP",
          description: result.message,
        });
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred while sending the OTP.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="proprietor">Proprietor</SelectItem>
                  {signatories.map(s => (
                     <SelectItem key={s.id} value={s.email}>Signatory: {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {watchedRole && (
             <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="Your email address" 
                            {...field} 
                            disabled
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        <Button type="submit" className="w-full font-bold" disabled={isSubmitting || !watchedRole}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Send OTP"}
        </Button>
      </form>
    </Form>
  );
}

function OtpStep({ sentOtp, onBack }: { sentOtp: string, onBack: () => void; }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { otp: "" },
  });
  
  const setLoginTimestamp = () => {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('loginDate', today);
  }

  const handleSubmit = (values: z.infer<typeof OTPSchema>) => {
    setIsSubmitting(true);
    // Simulate a short delay for UX
    setTimeout(() => {
      if (values.otp === sentOtp) {
        toast({
          title: "Success!",
          description: "You have been logged in successfully.",
        });
        setLoginTimestamp();
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect. Please try again.",
        });
        form.setError("otp", {
          type: "manual",
          message: "Incorrect OTP. Please try again.",
        });
        setIsSubmitting(false);
      }
    }, 500);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter OTP</FormLabel>
              <FormControl>
                <Input placeholder="Enter the 6-digit code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify & Login"}
        </Button>
        <Button variant="link" size="sm" className="w-full" onClick={onBack}>
          Back
        </Button>
      </form>
    </Form>
  );
}

export function LoginForm() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [sentOtp, setSentOtp] = useState("");

  const handleEmailSubmit = (email: string, otp: string) => {
    setSentOtp(otp);
    setStep("otp");
  };

  const handleBack = () => {
    setStep("email");
    setSentOtp("");
  };

  return step === "email" ? (
    <EmailStep onEmailSubmit={handleEmailSubmit} />
  ) : (
    <OtpStep sentOtp={sentOtp} onBack={handleBack} />
  );
}
