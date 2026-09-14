import React, { useState, useEffect, useRef } from 'react';
import { formatINR } from '../utils/LedgerEngine';
import './AnimatedNumber.css';

export default function AnimatedNumber({
  value = 0,
  format = formatINR,
  className = '',
  style = {},
  showDelta = true
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(numericValue);
  const [animClass, setAnimClass] = useState('');
  const [deltaInfo, setDeltaInfo] = useState(null);

  const prevValueRef = useRef(numericValue);
  const animFrameRef = useRef(null);
  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValueRef.current = numericValue;
      setDisplayValue(numericValue);
      return;
    }

    const prev = prevValueRef.current;
    const diff = numericValue - prev;

    if (Math.abs(diff) > 0.01) {
      // Direction: if diff < 0 -> falling down animation! If diff > 0 -> rising up
      const isReduction = diff < 0;
      setAnimClass(isReduction ? 'anim-falling' : 'anim-rising');

      if (showDelta) {
        setDeltaInfo({
          diff,
          formatted: `${diff > 0 ? '+' : ''}${format(diff)}`,
          isNegative: isReduction
        });
      }

      // Smooth numerical interpolation (digits roll to final value)
      const duration = 750; // ms
      const startTime = performance.now();
      const startVal = prev;
      const endVal = numericValue;

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(startVal + (endVal - startVal) * easeOut);

        setDisplayValue(currentVal);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
        }
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(step);

      // Clear animation classes after completion
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setAnimClass('');
        setDeltaInfo(null);
      }, 3000);

      prevValueRef.current = numericValue;
    } else {
      setDisplayValue(numericValue);
      prevValueRef.current = numericValue;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [numericValue, format, showDelta]);

  return (
    <span className={`animated-number-container ${className}`} style={style}>
      <span className={animClass}>
        {format(displayValue)}
      </span>
      {deltaInfo && (
        <span className={`delta-badge ${deltaInfo.isNegative ? 'negative' : 'positive'}`}>
          {deltaInfo.formatted}
        </span>
      )}
    </span>
  );
}
