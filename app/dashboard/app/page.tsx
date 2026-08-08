import { GraduationCap, ScanLine, Smartphone } from 'lucide-react'

const QR_SIZE = 29

function isFinderModule(row: number, column: number, top: number, left: number) {
  const localRow = row - top
  const localColumn = column - left

  if (localRow < 0 || localRow > 6 || localColumn < 0 || localColumn > 6) {
    return false
  }

  const isOuterEdge =
    localRow === 0 || localRow === 6 || localColumn === 0 || localColumn === 6
  const isCenter =
    localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4

  return isOuterEdge || isCenter
}

function isFinderArea(row: number, column: number) {
  return (
    (row <= 7 && column <= 7) ||
    (row <= 7 && column >= QR_SIZE - 8) ||
    (row >= QR_SIZE - 8 && column <= 7)
  )
}

function hasQrModule(row: number, column: number) {
  if (
    isFinderModule(row, column, 0, 0) ||
    isFinderModule(row, column, 0, QR_SIZE - 7) ||
    isFinderModule(row, column, QR_SIZE - 7, 0)
  ) {
    return true
  }

  if (isFinderArea(row, column)) {
    return false
  }

  if ((row === 6 || column === 6) && (row + column) % 2 === 0) {
    return true
  }

  const patternA = (row * 17 + column * 31 + row * column * 7) % 11
  const patternB = (row * 5 + column * 3 + row * column) % 7

  return patternA < 5 !== patternB < 3
}

function QrArtwork() {
  const modules = Array.from({ length: QR_SIZE }, (_, row) =>
    Array.from({ length: QR_SIZE }, (_, column) => ({ row, column }))
      .filter(({ row: moduleRow, column: moduleColumn }) =>
        hasQrModule(moduleRow, moduleColumn),
      ),
  ).flat()

  return (
    <div
      role="img"
      aria-label="QR code to open the Neurova mobile app"
      className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-white p-4 shadow-sm"
    >
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox={`-2 -2 ${QR_SIZE + 4} ${QR_SIZE + 4}`}
        shapeRendering="crispEdges"
      >
        <rect x="-2" y="-2" width={QR_SIZE + 4} height={QR_SIZE + 4} fill="white" />
        {modules.map(({ row, column }) => (
          <rect
            key={`${row}-${column}`}
            x={column}
            y={row}
            width="1"
            height="1"
            rx="0.18"
            fill="#111827"
          />
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-[5px] border-white bg-primary text-primary-foreground shadow-lg">
        <GraduationCap className="h-1/2 w-1/2" strokeWidth={2.5} />
      </div>
    </div>
  )
}

const students = [
  { initials: 'AM', color: 'from-amber-300 to-orange-500' },
  { initials: 'JL', color: 'from-sky-300 to-blue-500' },
  { initials: 'RK', color: 'from-fuchsia-300 to-violet-500' },
  { initials: 'SN', color: 'from-emerald-300 to-teal-500' },
  { initials: 'TW', color: 'from-rose-300 to-pink-500' },
  { initials: 'MK', color: 'from-indigo-300 to-blue-600' },
]

export default function MobileAppPage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#fbfbfd] text-foreground dark:bg-background">
      <div
        aria-hidden="true"
        className="absolute left-[18%] top-[22%] h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[4%] right-[8%] h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative container mx-auto grid min-h-[calc(100dvh-70px)] items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)] lg:gap-8 lg:px-10 lg:py-10">
        <section className="mx-auto w-full  lg:mx-0 lg:pl-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-2 text-sm font-medium text-primary">
            <Smartphone className="h-4 w-4" />
            Now available on Android &amp; iOS
          </div>

          <h1 className="mt-6 max-w-[500px] text-3xl font-bold leading-[1.08] tracking-[-0.045em] sm:mt-8 sm:text-5xl">
            Snap. Solve. Learn.
          </h1>

          <p className="mt-4 max-w-[570px] text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
            Take your study sets anywhere. Snap a question, get a clear answer,
            and keep learning wherever the day takes you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3" aria-label="Student community">
              {students.map((student) => (
                <div
                  key={student.initials}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#fbfbfd] bg-gradient-to-br ${student.color} text-[10px] font-bold text-white shadow-sm dark:border-background`}
                  title={student.initials}
                >
                  {student.initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-400" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} aria-hidden="true" className="text-base leading-none">
                    ★
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Loved by 20,000+ students
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[580px]">
          <div className="rounded-[22px] border border-border/80 bg-card px-4 py-6 text-center shadow-[0_24px_65px_-30px_rgba(15,23,42,0.35)] sm:rounded-[28px] sm:px-10 sm:py-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ScanLine className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em] ">
              Get the Neurova App
            </h2>
        
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI study companion on Android &amp; iOS.
            </p>

            <div className="relative mx-auto mt-8 w-full max-w-[250px] rounded-[30px] p-3">
              <div
                aria-hidden="true"
                className="absolute inset-2 rounded-[32px] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(34,211,238,.28),rgba(99,102,241,.24),rgba(236,72,153,.22),rgba(34,197,94,.23),rgba(34,211,238,.28))] blur-xl"
              />
              <div className="relative rounded-[26px] border border-border/60 bg-white/90 p-2">
                <QrArtwork />
              </div>
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Scan · Download · Start learning
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
