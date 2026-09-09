"use client";

import React, { useRef, useState, useCallback } from "react";

export interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  glowColor?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`relative transition-all duration-200 ease-out hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </div>
  );
};

export default TiltCard;
