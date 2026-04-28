import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion" // Adjust path to your shadcn components folder

const FAQ_DATA = [
  {
    id: "item-1",
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel anytime from your account settings with no questions asked. Weekly and monthly plans auto-renew but never lock you in."
  },
  {
    id: "item-2",
    question: "What happens after the 3-day free trial?",
    answer: "You'll be billed the annual rate only after your trial ends. We'll send you a reminder 24 hours before — you can cancel before then at no charge."
  },
  {
    id: "item-3",
    question: "Is the Weekly plan really free?",
    answer: "Yes — the weekly plan is free during our launch promotion. It includes all core features so you can try Bycat before committing."
  },
  {
    id: "item-4",
    question: "How does Live AI Tutoring work?",
    answer: "Our AI Tutoring uses advanced language models trained on your specific curriculum to provide step-by-step guidance, hints, and explanations in real-time."
  },
  {
    id: "item-5",
    question: "Is my data safe?",
    answer: "Absolutely. All data is encrypted at rest and in transit with AES-256 and TLS 1.3. We never sell your data to third parties."
  }
];


export default function FAQSection() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20">
      
      {/* --- HEADER --- */}
      <div className="mb-8">
        <h2 className="text-3xl font-[900] tracking-tight text-zinc-900 dark:text-white">
          {t("Frequently asked questions")}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
          {t("Everything you need to know before upgrading.")}
        </p>
      </div>

      {/* --- SHADCN ACCORDION CARD --- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] overflow-hidden shadow-sm mb-12">
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          {FAQ_DATA.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="border-b border-zinc-100 dark:border-zinc-800 last:border-none px-6"
            >
              <AccordionTrigger className="py-6 hover:no-underline hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 -mx-6 px-6 transition-all">
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 text-left">
                  {t(item.question)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-[15px] leading-relaxed font-medium">
                  {t(item.answer)}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* --- BOTTOM CTA BOX (Previous implementation) --- */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-[900] tracking-tight text-zinc-900 dark:text-white">
            {t("Still unsure? Start free.")}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            {t("The weekly plan is always free — no credit card needed.")}
          </p>
        </div>
        
        <button 
          className="bg-[#ED4B8E] hover:bg-[#D43D7A] text-white px-8 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95 shadow-[0_10px_20px_-5px_rgba(237,75,142,0.3)] whitespace-nowrap"
        >
          {t("Get started for free")} →
        </button>
      </div>

    </div>
  );
}