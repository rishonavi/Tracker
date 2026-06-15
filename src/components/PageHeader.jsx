export default function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <span className="mt-3 block h-[2px] w-12 bg-gold" />
        {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
