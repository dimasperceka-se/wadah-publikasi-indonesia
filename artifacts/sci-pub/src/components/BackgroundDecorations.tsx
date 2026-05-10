export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sp-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sp-grid)" />
      </svg>
    </div>
  );
}

export function DotPattern({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sp-dots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sp-dots)" />
      </svg>
    </div>
  );
}

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full blur-[100px] animate-pulse" style={{ background: "hsl(231 58% 36% / 0.08)" }} />
      <div className="absolute top-40 right-[15%] w-96 h-96 rounded-full blur-[120px] animate-pulse" style={{ background: "hsl(189 55% 51% / 0.08)", animationDelay: "2s" }} />
      <div className="absolute bottom-20 left-[30%] w-64 h-64 rounded-full blur-[100px] animate-pulse" style={{ background: "hsl(149 42% 74% / 0.10)", animationDelay: "4s" }} />
    </div>
  );
}

export function FlowingRibbons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Soft gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(210 70% 95% / 0.45) 0%, transparent 45%, hsl(189 55% 51% / 0.05) 100%)",
        }}
      />

      {/* Bottom-right ribbons */}
      <svg
        className="absolute -bottom-10 -right-10 w-[1100px] h-[1100px] opacity-[0.18]"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M900 300C750 320 600 450 500 500C400 550 300 520 200 600C100 680 50 750 0 800"
          stroke="url(#sp-ribbon1)"
          strokeWidth="60"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M900 400C800 380 650 480 550 540C450 600 350 580 250 650C150 720 80 770 0 820"
          stroke="url(#sp-ribbon2)"
          strokeWidth="50"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M900 500C780 460 680 530 580 580C480 630 380 640 280 700C180 760 100 790 0 840"
          stroke="url(#sp-ribbon3)"
          strokeWidth="45"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />
        <defs>
          <linearGradient id="sp-ribbon1" x1="0" y1="0" x2="900" y2="800">
            <stop offset="0%" stopColor="hsl(231, 58%, 36%)" />
            <stop offset="100%" stopColor="hsl(189, 55%, 51%)" />
          </linearGradient>
          <linearGradient id="sp-ribbon2" x1="0" y1="0" x2="800" y2="800">
            <stop offset="0%" stopColor="hsl(189, 55%, 51%)" />
            <stop offset="100%" stopColor="hsl(231, 58%, 50%)" />
          </linearGradient>
          <linearGradient id="sp-ribbon3" x1="0" y1="0" x2="700" y2="800">
            <stop offset="0%" stopColor="hsl(231, 58%, 36%)" />
            <stop offset="50%" stopColor="hsl(189, 55%, 51%)" />
            <stop offset="100%" stopColor="hsl(149, 42%, 74%)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Top-left ribbons */}
      <svg
        className="absolute -top-10 -left-10 w-[750px] h-[750px] opacity-[0.12] rotate-180"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M600 200C500 220 400 320 320 370C240 420 180 400 120 460C60 520 30 570 0 600"
          stroke="hsl(231, 58%, 36%)"
          strokeWidth="40"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M600 280C520 260 420 350 350 400C280 450 220 440 160 500C100 560 60 590 0 620"
          stroke="hsl(189, 55%, 51%)"
          strokeWidth="35"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
