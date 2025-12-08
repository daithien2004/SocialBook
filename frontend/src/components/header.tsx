// src/components/header/index.tsx (hoặc Header.tsx)
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const session = await getServerSession(authOptions);
  return <HeaderClient session={session} />;
}
