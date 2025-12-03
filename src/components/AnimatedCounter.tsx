import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export const AnimatedCounter = ({
  value,
  duration = 2000,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number>();

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      if (progress >= 1) {
        setDisplayValue(value);
        return;
      }
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const currentValue = easeOutExpo * value;
      
      setDisplayValue(currentValue);
      animationFrame.current = requestAnimationFrame(animate);
    };

    startTime.current = null;
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayValue.toLocaleString("it-IT", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
