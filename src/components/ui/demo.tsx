"use client"

import { ReceiptPricing, type ReceiptPlan } from "@/components/ui/receipt-pricing"

const PLANS: ReceiptPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "One developer, one product",
    monthly: 12,
    cta: "Start free trial",
    items: [
      { label: "Seats", value: "1" },
      { label: "Events / mo", value: "100K" },
      { label: "Retention", value: "30 d" },
      { label: "Alerts", value: "5" },
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "The whole product team",
    monthly: 32,
    featured: true,
    cta: "Start free trial",
    items: [
      { label: "Seats", value: "10" },
      { label: "Events / mo", value: "2M" },
      { label: "Retention", value: "12 mo" },
      { label: "Alerts", value: "Unlimited" },
      { label: "Slack support", value: "Incl." },
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Every team in the company",
    monthly: 96,
    cta: "Talk to sales",
    items: [
      { label: "Seats", value: "Unlimited" },
      { label: "Events / mo", value: "25M" },
      { label: "Retention", value: "3 yr" },
      { label: "SSO / SAML", value: "Incl." },
      { label: "Uptime SLA", value: "99.99%" },
    ],
  },
]

const settings = {
  monthsFree: 2,
  startYearly: false,
  showStamp: true,
  showBarcode: true,
  printMs: 460,
  merchant: "Meridian",
  headline: "Pricing, printed.",
  subline: "Every line item, the subtotal, and what you actually owe. Yearly reprints with two months off.",
}

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }

  return (
    <div className="bg-background flex min-h-[max(680px,100svh)] w-full flex-col items-center justify-center px-6 py-8">
      <ReceiptPricing
        key={String(s.startYearly)}
        plans={PLANS}
        defaultPeriod={s.startYearly ? "yearly" : "monthly"}
        merchant={s.merchant}
        merchantNote="Event analytics for product teams"
        orderPrefix="MD"
        monthsFree={s.monthsFree}
        printMs={s.printMs}
        showStamp={s.showStamp}
        showBarcode={s.showBarcode}
      >
        <div className="mx-auto mb-6 max-w-xl text-center">
          <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{s.headline}</h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-base text-pretty">{s.subline}</p>
        </div>
      </ReceiptPricing>
    </div>
  )
}
