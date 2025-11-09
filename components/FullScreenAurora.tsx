import React, { useEffect, useRef } from "react";

const FullScreenAurora: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    let frame = 0;
    let raf: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      frame += 0.015;

      // dark base
      ctx.fillStyle = "rgba(6, 11, 22, 1)";
      ctx.fillRect(0, 0, w, h);

      // draw 3 moving ribbons
      const layers = [
        { color: "rgba(32, 212, 255, 0.32)", speed: 1.6, amp: 90 },
        { color: "rgba(255, 79, 110, 0.24)", speed: 1.1, amp: 120 },
        { color: "rgba(139, 92, 246, 0.2)", speed: 0.7, amp: 150 },
      ];

      layers.forEach((layer, idx) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 14) {
          const y =
            h / 2 +
            Math.sin(frame * layer.speed + x * 0.01 + idx * 30) * layer.amp +
            Math.cos(frame * 0.6 + x * 0.003) * 28;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
      });

      // top glow
      const grad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.25,
        10,
        w * 0.5,
        h * 0.25,
        h * 0.8
      );
      grad.addColorStop(0, "rgba(255, 79, 110, 0.35)");
      grad.addColorStop(1, "rgba(6, 11, 22, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
};

export default FullScreenAurora;