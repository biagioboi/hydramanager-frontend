import React from "react";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <HeroUIProvider>
      <ToastProvider/>
      {children}
    </HeroUIProvider>
  );
}
