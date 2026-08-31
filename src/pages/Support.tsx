import { ArrowUpRight, LifeBuoy } from "lucide-react";
import FadeUp from "@/components/ui/FadeUp";

const HELPDESK_URL = "https://aacc-ai.com/helpdesk_ticket";

export default function Support() {
  return (
    <main
      className="grid min-h-screen place-items-center px-4 py-24 sm:px-6"
      style={{ backgroundColor: "#f4f7f6" }}
    >
      <FadeUp>
        <section className="w-full max-w-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <span
            className="mb-7 grid h-12 w-12 place-items-center rounded-xl"
            style={{ backgroundColor: "#e8f4ef", color: "var(--green)" }}
          >
            <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          </span>

          <p
            className="mb-3 text-xs font-semibold tracking-widest"
            style={{ color: "var(--green)" }}
          >
            ศูนย์ช่วยเหลือ
          </p>
          <h1
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{ color: "var(--navy)" }}
          >
            ต้องการความช่วยเหลือ?
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
            ส่งรายละเอียดปัญหาหรือคำขอผ่านระบบ Helpdesk
            เพื่อติดตามสถานะและรับการตอบกลับจากทีมงาน
          </p>

          <a
            href={HELPDESK_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--green)" }}
          >
            ไปยังระบบ Helpdesk
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>
      </FadeUp>
    </main>
  );
}
