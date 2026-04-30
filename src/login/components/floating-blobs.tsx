import React, {  useEffect, useRef } from "react";


export const FloatingBlobs = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blobCount = 3;
  const colors = ["bg-purple-400", "bg-[#4891C2]", "bg-[#FF7B7B]"];

  useEffect(() => {
    const blobs = Array.from({ length: blobCount }).map((_, i) => ({
      x: Math.random() * (window.innerWidth - 200),
      y: Math.random() * (window.innerHeight - 200),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      el: blobRefs.current[i],
    }));

    let animationFrameId: number;
    const animate = () => {
      blobs.forEach((blob) => {
        if (!blob.el) return;
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x <= -100 || blob.x >= window.innerWidth - 200) blob.vx *= -1;
        if (blob.y <= -100 || blob.y >= window.innerHeight - 200) blob.vy *= -1;
        blob.el.style.transform = `translate3d(${blob.x}px, ${blob.y}px, 0)`;
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {Array.from({ length: blobCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (blobRefs.current[i] = el)}
          className={`absolute w-80 h-80 md:w-96 md:h-96 rounded-full opacity-40 mix-blend-multiply blur-[100px] ${
            colors[i % colors.length]
          }`}
          style={{ top: 0, left: 0, willChange: "transform" }}
        />
      ))}
    </div>
  );
});
