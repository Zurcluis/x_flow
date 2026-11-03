import { notFound } from "next/navigation";
import { requirePublicToken } from "@/server/auth";
import { getDeliveryFeedbackByToken } from "@/server/deliveries";
import { FeedbackView } from "./FeedbackView";

export const dynamic = "force-dynamic";

export default async function PublicDeliveryFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (typeof token !== "string" || token.length === 0 || token.length > 100) {
    notFound();
  }

  await requirePublicToken("delivery", token);
  const feedback = await getDeliveryFeedbackByToken(token);
  if (!feedback) {
    notFound();
  }

  return <FeedbackView initialFeedback={feedback} />;
}
