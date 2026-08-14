'use client'

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { PolitiqueCommissionContent } from "@/components/legal/PolitiqueCommissionContent";

export default function PolitiqueCommissionPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <div className="flex-1 py-16 px-4 md:px-8 lg:px-12">
          <PolitiqueCommissionContent />
        </div>
      </div>
      <Footer />
    </>
  )
}
