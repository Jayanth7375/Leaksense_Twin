import { forwardRef } from "react"

export const Iphone16Pro = forwardRef(
  (
    {
      width = 433,
      height = 882,
      src,
      videoSrc,
      showIsland = true,
      islandWidth = 125,
      islandHeight = 40,
      frameColor = "#2a2a2a",
      bezelColor = "#0f0f0f",
      screenRadius = 55,
      shadow = true,
      rounded = true,
      contentStyle,
      showCamera = true,
      screenGradient,
      hoverAnimation = false,
      ...props
    },
    ref
  ) => {
    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: shadow
            ? "drop-shadow(0 20px 60px rgba(0,0,0,0.7)) drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
            : "none",
          transition: hoverAnimation ? "transform 0.5s" : "none",
          display: "block",
        }}
        {...props}
      >
        <defs>
          {/* Subtle edge highlight on frame */}
          <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#3a3a3a" />
          </linearGradient>
          <clipPath id="screenClip">
            <rect
              x="21" y="21"
              width={width - 42} height={height - 42}
              rx={screenRadius} ry={screenRadius}
            />
          </clipPath>
          {screenGradient && (
            <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={screenGradient.split(",")[0]} />
              <stop offset="100%" stopColor={screenGradient.split(",")[1] || screenGradient.split(",")[0]} />
            </linearGradient>
          )}
        </defs>

        {/* Outer titanium frame */}
        <rect
          x="1" y="1"
          width={width - 2} height={height - 2}
          rx={rounded ? 76 : 0}
          fill="url(#frameGrad)"
          stroke="#555" strokeWidth="1.5"
        />

        {/* Inner bezel / body */}
        <rect
          x="6" y="6"
          width={width - 12} height={height - 12}
          rx={rounded ? 70 : 0}
          fill={frameColor}
        />

        {/* Screen surround */}
        <rect
          x="20" y="20"
          width={width - 40} height={height - 40}
          rx={rounded ? 57 : 0}
          fill={bezelColor}
        />

        {/* Screen fill / gradient */}
        {screenGradient ? (
          <rect
            x="21" y="21"
            width={width - 42} height={height - 42}
            rx={screenRadius} ry={screenRadius}
            fill="url(#screenGrad)"
            clipPath="url(#screenClip)"
          />
        ) : (
          <rect
            x="21" y="21"
            width={width - 42} height={height - 42}
            rx={screenRadius} ry={screenRadius}
            fill="#111"
            clipPath="url(#screenClip)"
          />
        )}

        {/* Static image */}
        {src && (
          <image
            href={src}
            x="21" y="21"
            width={width - 42} height={height - 42}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#screenClip)"
            style={contentStyle}
          />
        )}

        {/* Video */}
        {videoSrc && (
          <foreignObject x="21" y="21" width={width - 42} height={height - 42} clipPath="url(#screenClip)">
            <video
              style={{ width: "100%", height: "100%", objectFit: "cover", ...contentStyle }}
              src={videoSrc}
              autoPlay loop muted playsInline
            />
          </foreignObject>
        )}

        {/* Side buttons — volume up */}
        <rect x="-3" y={height * 0.22} width="4" height="36" rx="2" fill="#333" />
        <rect x="-3" y={height * 0.22 + 48} width="4" height="36" rx="2" fill="#333" />
        {/* Power button */}
        <rect x={width - 1} y={height * 0.3} width="4" height="60" rx="2" fill="#333" />

        {/* Dynamic island */}
        {showIsland && (
          <rect
            x={width / 2 - islandWidth / 2}
            y="28"
            width={islandWidth}
            height={islandHeight}
            rx={islandHeight / 2}
            fill="#000"
          />
        )}

        {/* Camera dot inside island */}
        {showCamera && (
          <circle
            cx={width / 2 + islandWidth / 4}
            cy={28 + islandHeight / 2}
            r="5"
            fill="#1a1a1a"
          />
        )}

        {/* Screen glare */}
        <rect
          x="21" y="21"
          width={width - 42} height={height - 42}
          rx={screenRadius} ry={screenRadius}
          fill="url(#glare)"
          clipPath="url(#screenClip)"
          style={{ pointerEvents: "none" }}
        />
        <defs>
          <linearGradient id="glare" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.04" />
            <stop offset="40%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
)

Iphone16Pro.displayName = "Iphone16Pro"
