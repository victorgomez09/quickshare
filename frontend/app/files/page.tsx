import { getMe } from "@/api/user";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { FilesPageClient } from "./page-client";

export default async function FilesPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["getMe"],
    queryFn: getMe
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FilesPageClient />
    </HydrationBoundary>
  );
}
