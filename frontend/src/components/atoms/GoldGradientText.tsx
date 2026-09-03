import React from "react";

export interface GoldGradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

export const GoldGradientText: React.FC<GoldGradientTextProps> = ({
  as: Component = "span",
  children,
  className = "",
  ...props
}) => {
  return (
    <Component className={`text-gold-gradient ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default GoldGradientText;
