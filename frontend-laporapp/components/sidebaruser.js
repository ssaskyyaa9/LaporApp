"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { label: "Beranda", href: "/beranda", icon: "/assets/icons/beranda.png" },
  { label: "Buat laporan", href: "/buatlaporan", icon: "/assets/icons/buatlaporan.png" },
  { label: "Riwayat laporan", href: "/riwayatlaporan", icon: "/assets/icons/riwayatlaporan.png" },
  { label: "Kategori", href: "/kategori", icon: "/assets/icons/kategorisidebar.png" },
  { label: "Notifikasi", href: "/notifikasi", icon: "/assets/icons/notifikasi.png" },
  { label: "Profile", href: "/profile", icon: "/assets/icons/profile (2).png" },
  { label: "Keluar", href: "/keluar", icon: "/assets/icons/keluar.png" },
];

export default function Sidebar({ onToggle, unread = 0 }) {
  const [terbuka, setTerbuka] = useState(true);
  const pathname = usePathname();

  const tanganiToggle = () => {
    const baru = !terbuka;
    setTerbuka(baru);
    if (onToggle) onToggle(baru);
  };

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen z-40 bg-blue-600 flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden"
        style={{ width: terbuka ? "220px" : "64px" }}>

        <div className="flex items-center px-3 pt-6 pb-4 shrink-0">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <Image src="/assets/gambar/logo sidebar.png" alt="Logo LaporApp" width={40} height={40} />
          </div>
          <div className={`ml-3 overflow-hidden transition-[opacity,max-width] duration-300 ${terbuka ? "max-w-xs opacity-100" : "max-w-0 opacity-0"}`}>
            <span className="text-white font-bold text-lg whitespace-nowrap"> Lapor<span className="text-yellow-300">App</span> </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1">
          {menuItems.map((item) => {
            const aktif = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} title={!terbuka ? item.label : ""}
                className={`flex items-center h-10 px-2 rounded-xl transition-colors duration-200
                  ${aktif ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>

                <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                  <Image src={item.icon} alt={item.label} width={20} height={20} className="brightness-[10] opacity-90" />

                  {item.label === "Notifikasi" && unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>

                <div className={`ml-3 overflow-hidden transition-[opacity,max-width] duration-300 ${terbuka ? "max-w-xs opacity-100" : "max-w-0 opacity-0"}`}>
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span> 
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <button onClick={tanganiToggle}
        className="fixed top-12 z-50 w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shadow-md hover:bg-blue-200 transition-all duration-300"
        style={{ left: terbuka ? "204px" : "48px" }} aria-label={terbuka ? "Tutup sidebar" : "Buka sidebar"}>
        <Image src="/assets/icons/tandasidebar.png" alt="toggle" width={36} height={36}
          className={`transition-transform duration-300 ${terbuka ? "" : "rotate-180"}`} />
      </button>
    </>
  );
}