import { auth } from "@/auth";
import { NavbarContent } from "./navbar-content";

interface NavbarProps {
  variant?: "public" | "admin" | "detail";
}

export async function Navbar({ variant = "public" }: NavbarProps) {
  const session = await auth();

  return <NavbarContent variant={variant} session={session} />;
}
