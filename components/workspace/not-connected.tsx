import Link from "next/link";
import { Database } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export function NotConnected({
  slug,
  isOwner,
}: {
  slug: string;
  isOwner: boolean;
}) {
  return (
    <EmptyState
      icon={Database}
      title="Firebase isn't connected yet"
      description={
        isOwner
          ? "Connect your Firebase project to enable courses, files, assignments, and submissions."
          : "This workspace is still being set up. Check back soon."
      }
      action={
        isOwner ? (
          <Link
            href={`/${slug}/settings/firebase`}
            className={buttonVariants()}
          >
            Connect Firebase
          </Link>
        ) : undefined
      }
    />
  );
}
