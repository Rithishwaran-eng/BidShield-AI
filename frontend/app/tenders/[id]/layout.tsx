"use client";

import { useParams } from "next/navigation";
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import Footer from "@/app/components/Footer";

export default function TenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tenderId = params.id as string;

  return (
    <>
      <Header />
      <div className="layout-with-sidebar">
        <Sidebar tenderId={tenderId} />
        <main className="main-content">{children}</main>
      </div>
      <Footer />
    </>
  );
}
