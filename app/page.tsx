"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        const role = (session.user as any).role;
        if (role === "ADMIN") {
          router.replace("/dashboard/admin");
        } else {
          router.replace("/dashboard/framer");
        }
      } else {
        router.replace("/auth/login");
      }
    }
  }, [session, isPending, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#045339]" />
        <p className="text-sm text-gray-500 font-medium">Loading session...</p>
      </div>
    </div>
  );
}
