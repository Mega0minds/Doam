'use client';
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/10 animate-[float_var(--dur)_ease-in-out_infinite_var(--delay)]"
          style={{
            width: `${4 + (i % 5) * 3}px`,
            height: `${4 + (i % 5) * 3}px`,
            left: `${(i * 17) % 100}%`,
            top: `${(i * 23 + 10) % 100}%`,
            '--dur': `${6 + (i % 4) * 2}s`,
            '--delay': `${(i % 7) * -1.5}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
