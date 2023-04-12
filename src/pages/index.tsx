import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className=" w-full max-w-5xl items-center justify-between lg:flex">
        <h1>H1 Title</h1>
      </div>
    </main>
  );
}
