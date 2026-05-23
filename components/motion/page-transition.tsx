"use client";



import { motion, AnimatePresence } from "motion/react";

import { usePathname } from "next/navigation";

import { useEffect } from "react";

import { springPage } from "@/lib/motion-presets";

import { perfMark, perfMeasure } from "@/lib/dev-perf";

import { isSnappyNav } from "@/lib/snappy-nav";

import { useReducedMotion } from "@/lib/use-reduced-motion";



export function PageTransition({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();

  const reduced = useReducedMotion();

  const snappy = isSnappyNav();



  useEffect(() => {

    perfMark("page-transition:enter-end");

    perfMeasure("page-transition:enter", "page-transition:enter-start", "page-transition:enter-end");

  }, [pathname]);



  useEffect(() => {

    perfMark("page-transition:enter-start");

  }, [pathname]);



  if (reduced || snappy) {

    if (snappy && !reduced) {

      return (

        <div key={pathname} className="min-h-0 flex-1 animate-fade-in">

          {children}

        </div>

      );

    }

    return <div className="min-h-0 flex-1">{children}</div>;

  }



  return (

    <AnimatePresence

      mode="sync"

      onExitComplete={() => perfMark("page-transition:exit-end")}

    >

      <motion.div

        key={pathname}

        initial={{ opacity: 0, y: 10 }}

        animate={{ opacity: 1, y: 0 }}

        exit={{ opacity: 0, y: -6 }}

        transition={springPage}

        className="min-h-0 flex-1"

        onAnimationStart={() => perfMark("page-transition:exit-start")}

      >

        {children}

      </motion.div>

    </AnimatePresence>

  );

}


