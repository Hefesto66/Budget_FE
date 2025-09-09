"use client";
import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/Header";

// Dynamically import the main content with SSR turned off.
// This is a robust way to prevent any client-side code from running during the build.
const HomeClient = dynamic(() => import('@/app/home-client'), { ssr: false });

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
       <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>
      <Header />
      <main className="flex-1">
        <HomeClient />
      </main>
    </div>
  );
}
