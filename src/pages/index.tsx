"use-client";

import Image from "next/image";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
  });
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className=" w-full items-center justify-between">
        {/* <h1>H1 Title</h1> */}
        <Map />
      </div>
    </main>
  );
}
