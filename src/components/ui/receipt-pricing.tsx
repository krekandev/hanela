"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ReceiptPeriod = "monthly" | "yearly"

/** One printed ledger row: a label on the left, a short value on the right, dot leaders between. */
export interface ReceiptItem {
  /** Left column. Printed as given; short uppercase reads most like a receipt. */
  label: string
  /** Right column. Keep it to a few characters: "10", "2M", "UNLIMITED". */
  value: string
}

export interface ReceiptPlan {
  /** Stable id. Also seeds the order number and the barcode, so both stay consistent between renders. */
  id: string
  /** Plan name, printed as the document title. */
  name: string
  /** One short line under the plan name. */
  tagline?: string
  /** Price per month when billed monthly, in major units (32 = $32.00). */
  monthly: number
  /** Total per year when billed yearly. Defaults to `monthly * (12 - monthsFree)`. */
  yearly?: number
  /** Ledger rows printed between the plan name and the total. 4–7 reads best. */
  items: ReceiptItem[]
  /** Button label. Defaults to `Choose <name>`. */
  cta?: string
  /** Prints "MOST POPULAR", uses the primary-colored button and gets the savings stamp first. */
  featured?: boolean
}

export interface ReceiptPricingProps extends React.ComponentProps<"section"> {
  /** The plans to print, left to right. */
  plans: ReceiptPlan[]
  /** Controlled billing period. */
  period?: ReceiptPeriod
  /** Uncontrolled starting period. */
  defaultPeriod?: ReceiptPeriod
  /** Called when the reader switches period (before the paper finishes reprinting). */
  onPeriodChange?: (period: ReceiptPeriod) => void
  /** Called when a plan's button is pressed. */
  onSelectPlan?: (plan: ReceiptPlan, period: ReceiptPeriod) => void
  /** Months waived on yearly billing. Drives the default yearly price and the discount line. */
  monthsFree?: number
  /** ISO 4217 code for `Intl.NumberFormat`. */
  currency?: string
  /** Locale for `Intl.NumberFormat`. Fixed by default so server and client format identically. */
  locale?: string
  /** Printed at the top of every receipt. */
  merchant?: string
  /** Small line under the merchant. */
  merchantNote?: string
  /** Two letters in front of the generated order number. */
  orderPrefix?: string
  /** Labels for the two radio options. */
  periodLabels?: [string, string]
  /** Stamp text on yearly receipts. `{months}` is replaced with `monthsFree`. */
  stampLabel?: string
  /** Print the rotated savings stamp on yearly receipts. */
  showStamp?: boolean
  /** Print the barcode block at the foot of each receipt. */
  showBarcode?: boolean
  /** Print the receipts the first time the section scrolls into view. */
  printOnReveal?: boolean
  /** Milliseconds for one receipt to print top to bottom. */
  printMs?: number
  /** Milliseconds for the old receipt to tear off. Exits are shorter than entrances on purpose. */
  tearMs?: number
  /** Milliseconds between receipts, so the row prints left to right. */
  stagger?: number
  /** Distance in px between the serrations on the torn edges. */
  toothWidth?: number
  /** Depth in px of each serration. Half of `toothWidth` gives a continuous zigzag. */
  toothDepth?: number
  /** Strength (0–1) of the thermal scan lines on the paper. 0 turns them off. */
  grain?: number
}

type Phase = "idle" | "tear" | "hidden" | "print"

const ENTER = "cubic-bezier(0.22, 1, 0.36, 1)"
const EXIT = "cubic-bezier(0.4, 0, 1, 1)"

/** FNV-1a. Small, stable, and enough to give every plan its own order number and barcode. */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Bar widths in px, derived from the seed so the same receipt always prints the same code. */
function bars(seed: string, count: number): number[] {
  let h = hash(seed)
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
    out.push((h % 3) + 1)
  }
  return out
}

function useReducedMotion(): boolean {
  const subscribe = React.useCallback((onChange: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/**
 * ReceiptPricing — a pricing section whose plans print like thermal receipts.
 */
export function ReceiptPricing({
  plans,
  period,
  defaultPeriod = "monthly",
  onPeriodChange,
  onSelectPlan,
  monthsFree = 2,
  currency = "USD",
  locale = "en-US",
  merchant = "Acme",
  merchantNote = "Thank you for your business",
  orderPrefix = "AC",
  periodLabels = ["Monthly", "Yearly"],
  stampLabel = "{months} months free",
  showStamp = true,
  showBarcode = true,
  printOnReveal = true,
  printMs = 460,
  tearMs = 200,
  stagger = 60,
  toothWidth = 12,
  toothDepth = 6,
  grain = 0.05,
  className,
  children,
  ...rest
}: ReceiptPricingProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const reduce = useReducedMotion()

  const [internal, setInternal] = React.useState<ReceiptPeriod>(defaultPeriod)
  const selected = period ?? internal
  const [printed, setPrinted] = React.useState<ReceiptPeriod>(selected)
  const [phase, setPhase] = React.useState<Phase>("idle")

  const count = Math.max(plans.length, 1)
  const rowMs = (base: number) => base + stagger * (count - 1)

  React.useEffect(() => {
    if (selected === printed) return
    if (reduce || printMs + tearMs === 0) {
      setPrinted(selected)
      setPhase("idle")
      return
    }
    const tearDone = rowMs(tearMs)
    setPhase("tear")
    const t1 = window.setTimeout(() => {
      setPrinted(selected)
      setPhase("hidden")
    }, tearDone)
    const t2 = window.setTimeout(() => setPhase("print"), tearDone + 32)
    const t3 = window.setTimeout(() => setPhase("idle"), tearDone + 32 + rowMs(printMs))
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [selected, reduce])

  useIsoLayoutEffect(() => {
    const host = rootRef.current
    if (!host || !printOnReveal || reduce) return
    let t1 = 0
    let t2 = 0
    const start = () => {
      t1 = window.setTimeout(() => setPhase("print"), 32)
      t2 = window.setTimeout(() => setPhase("idle"), 32 + rowMs(printMs))
    }
    setPhase("hidden")
    const rect = host.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      start()
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        start()
      },
      { threshold: 0.2 }
    )
    io.observe(host)
    return () => {
      io.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  const money = React.useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale, currency]
  )

  const select = (next: ReceiptPeriod) => {
    if (period === undefined) setInternal(next)
    onPeriodChange?.(next)
  }

  const onOptionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const order: ReceiptPeriod[] = ["monthly", "yearly"]
    const at = order.indexOf(selected)
    let next = at
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (at + 1) % order.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (at + order.length - 1) % order.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = order.length - 1
    else return
    e.preventDefault()
    const value = order[next]
    if (!value) return
    select(value)
    optionRefs.current[next]?.focus()
  }

  const stamp = stampLabel.replace("{months}", String(monthsFree))
  const summary = plans
    .map((p) => {
      const due = printed === "yearly" ? (p.yearly ?? p.monthly * (12 - monthsFree)) : p.monthly
      return `${p.name} ${money.format(due)} ${printed === "yearly" ? "per year" : "per month"}`
    })
    .join(", ")

  return (
    <section
      ref={rootRef}
      data-slot="receipt-pricing"
      data-period={selected}
      className={cn("w-full", className)}
      {...rest}
    >
      {children}

      <div
        data-slot="period-toggle"
        role="radiogroup"
        aria-label="Billing period"
        className="bg-muted mx-auto flex h-11 w-fit items-center rounded-full p-1"
      >
        {(["monthly", "yearly"] as const).map((option, i) => {
          const active = selected === option
          return (
            <button
              key={option}
              ref={(node) => {
                optionRefs.current[i] = node
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-slot={option === "yearly" ? "cta-primary" : "period-option"}
              data-period={option}
              data-state={active ? "checked" : "unchecked"}
              onClick={() => select(option)}
              onKeyDown={onOptionKeyDown}
              className={cn(
                "focus-visible:ring-ring/50 h-9 cursor-pointer rounded-full px-5 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-[3px]",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {periodLabels[i]}
            </button>
          )
        })}
      </div>

      <div
        data-slot="receipt-row"
        className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 items-start justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {plans.map((plan, i) => (
          <ReceiptSlip
            key={plan.id}
            plan={plan}
            period={printed}
            phase={phase}
            delay={stagger * i}
            index={i}
            money={money}
            monthsFree={monthsFree}
            merchant={merchant}
            merchantNote={merchantNote}
            orderPrefix={orderPrefix}
            stamp={stamp}
            showStamp={showStamp}
            showBarcode={showBarcode}
            printMs={printMs}
            tearMs={tearMs}
            toothWidth={toothWidth}
            toothDepth={toothDepth}
            grain={grain}
            onSelect={() => onSelectPlan?.(plan, selected)}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Billed {printed}. {summary}.
      </p>
    </section>
  )
}

export interface ReceiptSlipProps {
  plan: ReceiptPlan
  period: ReceiptPeriod
  phase: Phase
  delay: number
  index: number
  money: Intl.NumberFormat
  monthsFree: number
  merchant: string
  merchantNote: string
  orderPrefix: string
  stamp: string
  showStamp: boolean
  showBarcode: boolean
  printMs: number
  tearMs: number
  toothWidth: number
  toothDepth: number
  grain: number
  onSelect: () => void
}

/** One slip of paper. Exported so a single plan can be dropped into a card or a checkout page. */
export function ReceiptSlip({
  plan,
  period,
  phase,
  delay,
  index,
  money,
  monthsFree,
  merchant,
  merchantNote,
  orderPrefix,
  stamp,
  showStamp,
  showBarcode,
  printMs,
  tearMs,
  toothWidth,
  toothDepth,
  grain,
  onSelect,
}: ReceiptSlipProps) {
  const yearly = plan.yearly ?? plan.monthly * (12 - monthsFree)
  const isYearly = period === "yearly"
  const subtotal = isYearly ? plan.monthly * 12 : plan.monthly
  const discount = isYearly ? subtotal - yearly : 0
  const due = isYearly ? yearly : plan.monthly
  const perMonth = isYearly ? yearly / 12 : plan.monthly
  const order = `${orderPrefix}-${(hash(plan.id) % 90000) + 10000}`
  const code = `${order}-${isYearly ? "YR" : "MO"}`

  const paper: React.CSSProperties = {
    ["--tooth-w" as string]: `${toothWidth}px`,
    ["--tooth-h" as string]: `${toothDepth * 2}px`,
    maskImage: MASK_LAYERS,
    maskSize: MASK_SIZE,
    maskPosition: MASK_POSITION,
    maskRepeat: MASK_REPEAT,
    WebkitMaskImage: MASK_LAYERS,
    WebkitMaskSize: MASK_SIZE,
    WebkitMaskPosition: MASK_POSITION,
    WebkitMaskRepeat: MASK_REPEAT,
    backgroundImage:
      grain > 0
        ? `repeating-linear-gradient(180deg, color-mix(in oklab, currentColor ${(grain * 100).toFixed(1)}%, transparent) 0 1px, transparent 1px 4px)`
        : undefined,
    ...phaseStyle(phase, delay, printMs, tearMs),
  }

  return (
    <div
      data-slot="receipt-slip"
      data-plan={plan.id}
      className="w-full max-w-[19rem] transition-transform duration-200 ease-out hover:-translate-y-0.5"
      style={{ filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.06)) drop-shadow(0 10px 14px rgb(0 0 0 / 0.14))" }}
    >
      <article
        aria-label={`${plan.name} plan`}
        className="bg-card text-card-foreground border-border/70 dark:bg-foreground dark:text-background dark:border-background/15 relative overflow-hidden border-x px-6 pt-8 pb-7 font-mono"
        style={paper}
      >
        <header className="text-center">
          <p className="text-[13px] font-semibold tracking-[0.34em] uppercase">{merchant}</p>
          <p className="text-muted-foreground dark:text-background/65 mt-1.5 text-[11px] tracking-[0.14em] uppercase">{merchantNote}</p>
        </header>

        <Rule className="mt-5" />

        <dl className="text-muted-foreground dark:text-background/65 mt-3 space-y-1 text-[11px] tracking-[0.1em] uppercase">
          <div className="flex justify-between gap-3">
            <dt>Order</dt>
            <dd className="text-card-foreground dark:text-background tabular-nums">{order}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Billing</dt>
            <dd className="text-card-foreground dark:text-background">{isYearly ? "Yearly" : "Monthly"}</dd>
          </div>
        </dl>

        <Rule className="mt-3" />

        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold tracking-[0.2em] uppercase">{plan.name}</h3>
          {plan.tagline ? <p className="text-muted-foreground dark:text-background/65 mt-1 text-[11px] tracking-[0.1em] uppercase">{plan.tagline}</p> : null}
          {plan.featured ? (
            <p className="text-primary dark:text-[color-mix(in_oklab,var(--color-primary)_40%,var(--color-background))] mt-2 text-[11px] font-semibold tracking-[0.24em] uppercase">
              <span aria-hidden="true">*** </span>Most popular<span aria-hidden="true"> ***</span>
            </p>
          ) : null}
        </div>

        <Rule className="mt-4" />

        <ul className="mt-4 space-y-1.5 text-xs tracking-[0.06em] uppercase">
          {plan.items.map((item) => (
            <li key={item.label} className="flex items-baseline gap-1.5">
              <span className="shrink-0">{item.label}</span>
              <span aria-hidden="true" className="border-current/30 min-w-3 flex-1 translate-y-[-0.28em] border-b border-dotted" />
              <span className="shrink-0 tabular-nums">{item.value}</span>
            </li>
          ))}
        </ul>

        <Rule className="mt-4" />

        <dl className="mt-4 space-y-1.5 text-xs tracking-[0.06em] uppercase">
          <div className="flex items-baseline justify-between gap-3">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{money.format(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="text-primary dark:text-[color-mix(in_oklab,var(--color-primary)_40%,var(--color-background))] flex items-baseline justify-between gap-3">
              <dt>{monthsFree} months free</dt>
              <dd className="tabular-nums">-{money.format(discount)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="border-current/40 mt-3 border-t-[3px] border-double pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.1em] uppercase">Total due</p>
            <p className="text-xl font-semibold tabular-nums">{money.format(due)}</p>
          </div>
          <p className="text-muted-foreground dark:text-background/65 mt-1.5 text-[11px] tracking-[0.1em] uppercase">
            {isYearly ? `${money.format(perMonth)} / mo · billed yearly` : "Billed monthly · cancel anytime"}
          </p>
        </div>

        {showStamp && isYearly && monthsFree > 0 ? (
          <p
            className="border-primary/45 text-primary dark:border-background/50 dark:text-background mx-auto mt-4 w-fit border-2 px-2.5 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase"
            style={{ transform: `rotate(${-3 + (index % 3) * 0.9}deg)` }}
          >
            {stamp}
          </p>
        ) : null}

        <button
          type="button"
          data-slot="plan-cta"
          onClick={onSelect}
          className={cn(
            "focus-visible:ring-ring/50 mt-5 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md text-xs font-semibold tracking-[0.16em] uppercase outline-none transition-[background-color,transform] duration-200 focus-visible:ring-[3px] active:scale-[0.98]",
            plan.featured
              ? "bg-primary text-primary-foreground dark:bg-background dark:text-foreground hover:opacity-90"
              : "border-current/30 hover:bg-current/5 border"
          )}
        >
          {plan.cta ?? `Choose ${plan.name}`}
        </button>

        {showBarcode ? (
          <div className="mt-6">
            <div aria-hidden="true" className="mx-auto flex h-9 w-fit items-stretch">
              {bars(code, 46).map((w, b) => (
                <span
                  key={b}
                  className={b % 2 === 0 ? "bg-current" : ""}
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <p aria-hidden="true" className="text-muted-foreground dark:text-background/65 mt-1.5 text-center text-[11px] tracking-[0.24em] uppercase">{code}</p>
          </div>
        ) : null}

        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={headStyle(phase, delay, printMs)} />
      </article>
    </div>
  )
}

/** 
 * OrderTicketReceipt — Specialized Slovak thermal confectionery receipt ("Bloček")
 * for the Hanela reservation summary with live fields, serrated edges and barcode.
 */
export interface OrderTicketReceiptProps {
  orderCode: string
  merchant?: string
  merchantNote?: string
  title: string
  badge?: string
  items: Array<{ label: string; value: string }>
  priceNote: string
  pickupLocation?: string
  notice?: string
  className?: string
}

export function OrderTicketReceipt({
  orderCode,
  merchant = "HANELA · CUKRÁREŇ",
  merchantNote = "VINIČNÉ & SLOVENSKÝ GROB",
  title,
  badge = "ZÁKAZKOVÁ VÝROBA",
  items,
  priceNote,
  pickupLocation = "Výrobňa Hlavná 102, Viničné",
  notice = "Nezáväzný dopyt · Potvrdenie do 24h",
  className,
}: OrderTicketReceiptProps) {
  const paper: React.CSSProperties = {
    ["--tooth-w" as string]: "12px",
    ["--tooth-h" as string]: "12px",
    maskImage: MASK_LAYERS,
    maskSize: MASK_SIZE,
    maskPosition: MASK_POSITION,
    maskRepeat: MASK_REPEAT,
    WebkitMaskImage: MASK_LAYERS,
    WebkitMaskSize: MASK_SIZE,
    WebkitMaskPosition: MASK_POSITION,
    WebkitMaskRepeat: MASK_REPEAT,
    backgroundImage: `repeating-linear-gradient(180deg, color-mix(in oklab, currentColor 4%, transparent) 0 1px, transparent 1px 4px)`,
  }

  const code = orderCode || "HN-749201"

  return (
    <div
      className={cn("w-full max-w-[22rem] mx-auto", className)}
      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08)) drop-shadow(0 14px 22px rgba(0,0,0,0.12))" }}
    >
      <article
        aria-label="Rezervačný doklad"
        className="bg-[#FFFFFF] text-[#261B24] border-x border-[#E2DFD7] relative overflow-hidden px-6 sm:px-7 pt-9 pb-8 font-mono transition-all duration-300"
        style={paper}
      >
        {/* Header */}
        <header className="text-center">
          <p className="text-[12px] font-bold tracking-[0.28em] text-[#261B24] uppercase">{merchant}</p>
          <p className="text-[#261B24]/60 mt-1 text-[10px] tracking-[0.18em] uppercase font-sans">{merchantNote}</p>
        </header>

        <Rule className="mt-4" />

        {/* Order Meta */}
        <dl className="text-[#261B24]/75 mt-3 space-y-1 text-[11px] tracking-[0.08em] uppercase">
          <div className="flex justify-between gap-3">
            <dt>Číslo dopytu</dt>
            <dd className="font-bold text-[#261B24] tabular-nums">{code}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Typ požiadavky</dt>
            <dd className="text-[#261B24]">{badge}</dd>
          </div>
        </dl>

        <Rule className="mt-3.5" />

        {/* Selected Product Title */}
        <div className="mt-3.5 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#aa5ca5] font-bold">
            *** POLOŽKA OBJEDNÁVKY ***
          </p>
          <h3 className="text-base sm:text-lg font-bold tracking-[0.1em] text-[#261B24] uppercase mt-1">
            {title}
          </h3>
        </div>

        <Rule className="mt-3.5" />

        {/* Ledger Rows with Dot Leaders */}
        <ul className="mt-3.5 space-y-2 text-[11px] sm:text-xs tracking-[0.04em] uppercase">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-baseline gap-1.5 min-w-0">
              <span className="shrink text-[#261B24]/75 truncate max-w-[65%]">{item.label}</span>
              <span aria-hidden="true" className="border-current/30 min-w-2 flex-1 translate-y-[-0.28em] border-b border-dotted shrink-0" />
              <span className="shrink-0 font-semibold text-[#261B24] text-right ml-auto">
                {item.value}
              </span>
            </li>
          ))}
        </ul>

        <Rule className="mt-4" />

        {/* Double Border Total Due Line */}
        <div className="border-current/40 mt-3 border-t-[3px] border-double pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.12em] uppercase">Orientačná suma</p>
            <p className="text-lg sm:text-xl font-bold text-[#261B24] tabular-nums">{priceNote}</p>
          </div>
          <p className="text-[#261B24]/60 mt-1.5 text-[10px] tracking-[0.08em] uppercase">
            Platba pri prevzatí alebo zálohovou faktúrou
          </p>
        </div>

        {/* Stamp */}
        <div className="my-4 flex justify-center">
          <p
            className="border-[#4a2847] text-[#4a2847] border-2 px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase bg-[#f5eef5]/60"
            style={{ transform: "rotate(-2deg)" }}
          >
            NEZÁVÄZNÁ REZERVÁCIA
          </p>
        </div>

        {/* Barcode Block */}
        <div className="mt-4 pt-2 border-t border-dashed border-current/25">
          <div aria-hidden="true" className="mx-auto flex h-8 w-fit items-stretch">
            {bars(code, 42).map((w, b) => (
              <span
                key={b}
                className={b % 2 === 0 ? "bg-current" : ""}
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <p aria-hidden="true" className="text-[#261B24]/60 mt-1.5 text-center text-[10px] tracking-[0.25em] uppercase font-mono">
            {code}-HN
          </p>
        </div>

        {/* Bottom Location Note */}
        <div className="mt-3 text-center text-[9px] text-[#261B24]/60 tracking-wider uppercase font-sans space-y-0.5">
          <p>{pickupLocation}</p>
          <p>{notice}</p>
        </div>
      </article>
    </div>
  )
}

function Rule({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("border-current/30 border-t border-dashed", className)} />
}

const MASK_LAYERS = [
  "linear-gradient(135deg, transparent 50%, black 0)",
  "linear-gradient(-135deg, transparent 50%, black 0)",
  "linear-gradient(black, black)",
  "linear-gradient(135deg, black 50%, transparent 0)",
  "linear-gradient(-135deg, black 50%, transparent 0)",
].join(", ")
const MASK_SIZE =
  "var(--tooth-w) var(--tooth-h), var(--tooth-w) var(--tooth-h), 100% calc(100% - var(--tooth-h)), var(--tooth-w) var(--tooth-h), var(--tooth-w) var(--tooth-h)"
const MASK_POSITION = "0 0, 0 0, 0 calc(var(--tooth-h) / 2), 0 100%, 0 100%"
const MASK_REPEAT = "repeat-x, repeat-x, no-repeat, repeat-x, repeat-x"

function phaseStyle(phase: Phase, delay: number, printMs: number, tearMs: number): React.CSSProperties {
  switch (phase) {
    case "tear":
      return {
        clipPath: "inset(0 0 0 0)",
        transform: "translateY(28px) rotate(0.5deg)",
        opacity: 0,
        transition: `transform ${tearMs}ms ${EXIT} ${delay}ms, opacity ${tearMs}ms linear ${delay}ms`,
      }
    case "hidden":
      return { clipPath: "inset(0 0 100% 0)", transform: "none", opacity: 1, transition: "none" }
    case "print":
      return {
        clipPath: "inset(0 0 0 0)",
        transform: "none",
        opacity: 1,
        transition: `clip-path ${printMs}ms ${ENTER} ${delay}ms`,
      }
    default:
      return { clipPath: "inset(0 0 0 0)", transform: "none", opacity: 1 }
  }
}

function headStyle(phase: Phase, delay: number, printMs: number): React.CSSProperties {
  const bar =
    "linear-gradient(to bottom, transparent 0%, transparent 86%, color-mix(in oklab, currentColor 6%, transparent) 97%, color-mix(in oklab, currentColor 30%, transparent) 100%)"
  if (phase === "hidden") return { backgroundImage: bar, transform: "translateY(-100%)", opacity: 1, transition: "none" }
  if (phase === "print")
    return {
      backgroundImage: bar,
      transform: "translateY(0)",
      opacity: 1,
      transition: `transform ${printMs}ms ${ENTER} ${delay}ms`,
    }
  return { backgroundImage: bar, transform: "translateY(0)", opacity: 0, transition: "opacity 160ms linear" }
}

export default ReceiptPricing
