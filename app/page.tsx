// import { AppContainer } from "@/components/AppContainer";
// import { redirect } from "next/navigation";
// export default function Home() {
//   return <AppContainer />;
// }
// app/page.tsx
import { AppContainer } from "@/components/AppContainer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // Optional: Add server-side check for immediate redirect (faster UX)
  const cookieStore = await cookies();
  const token = cookieStore.get("pharmt_token");
  
  if (!token) {
    redirect("/login");
  }
  
  return <AppContainer />;
}