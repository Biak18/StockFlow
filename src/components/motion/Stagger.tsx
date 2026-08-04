import React from "react";
import { FadeIn } from "./FadeIn";

interface StaggerProps {
  children: React.ReactNode;
  baseDelay?: number;
  step?: number;
}

/**
 * Wraps each child in FadeIn with increasing delay.
 */
export function Stagger({ children, baseDelay = 40, step = 50 }: StaggerProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <FadeIn key={child.key ?? index} delay={baseDelay + index * step}>
            {child}
          </FadeIn>
        );
      })}
    </>
  );
}
