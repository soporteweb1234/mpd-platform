import { Sidebar } from "@/components/layout/Sidebar";
import { NAVIGATION } from "@/lib/constants";

type AdminSidebarProps = {
  user: {
    name: string;
    avatar?: string | null;
    role?: string;
  };
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  return <Sidebar items={NAVIGATION.admin} user={user} type="admin" />;
}
