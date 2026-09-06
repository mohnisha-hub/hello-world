"use server";

import { redirect } from "next/navigation";
import {
  acceptBidAction,
  archiveBidSoldAction,
  buyPerfumeAction,
  declineBidAction,
  placeBidAction,
  ratePurchaseAction,
  sendMessageAction,
} from "@/actions/bids";
import {
  deleteCollectionAction,
  deletePerfumeAction,
  markPerfumeSoldAction,
  restoreItemAction,
  togglePinAction,
} from "@/actions/listings";
import { toggleWishlistAction } from "@/actions/wishlist";
import { logoutAction } from "@/actions/auth";
import { withNotice } from "@/lib/notice";

export async function pinForm(formData: FormData): Promise<void> {
  const res = await togglePinAction(formData);
  if (res && "error" in res && res.error) redirect(withNotice("/me", res.error));
}
export async function soldForm(formData: FormData): Promise<void> {
  await markPerfumeSoldAction(formData);
}
export async function deletePerfumeForm(formData: FormData): Promise<void> {
  await deletePerfumeAction(formData);
}
export async function deleteCollectionForm(formData: FormData): Promise<void> {
  await deleteCollectionAction(formData);
}
export async function restoreForm(formData: FormData): Promise<void> {
  await restoreItemAction(formData);
}
export async function wishlistForm(formData: FormData): Promise<void> {
  await toggleWishlistAction(formData);
}
export async function buyForm(formData: FormData): Promise<void> {
  const perfumeId = String(formData.get("perfumeId"));
  const res = await buyPerfumeAction(formData);
  if (res && "error" in res && res.error) {
    redirect(withNotice(`/p/${perfumeId}`, res.error));
  }
}
export async function bidForm(formData: FormData): Promise<void> {
  const perfumeId = String(formData.get("perfumeId"));
  const res = await placeBidAction(formData);
  if (res && "error" in res && res.error) {
    redirect(withNotice(`/p/${perfumeId}`, res.error));
  }
  redirect(withNotice(`/p/${perfumeId}`, "Bid sent."));
}
export async function acceptBidForm(formData: FormData): Promise<void> {
  const res = await acceptBidAction(formData);
  if (res && "error" in res && res.error) redirect(withNotice("/me/bids", res.error));
}
export async function declineBidForm(formData: FormData): Promise<void> {
  const res = await declineBidAction(formData);
  if (res && "error" in res && res.error) redirect(withNotice("/me/bids", res.error));
  redirect(withNotice("/me/bids", "Bid declined."));
}
export async function archiveBidForm(formData: FormData): Promise<void> {
  const res = await archiveBidSoldAction(formData);
  if (res && "error" in res && res.error) redirect(withNotice("/me/bids", res.error));
}
export async function rateForm(formData: FormData): Promise<void> {
  const res = await ratePurchaseAction(formData);
  if (res && "error" in res && res.error) redirect(withNotice("/me/bids?tab=archives", res.error));
}
export async function messageForm(formData: FormData): Promise<void> {
  const conversationId = String(formData.get("conversationId"));
  const res = await sendMessageAction(formData);
  if (res && "error" in res && res.error) {
    redirect(withNotice(`/me/messages/${conversationId}`, res.error));
  }
}
export async function logoutForm(): Promise<void> {
  await logoutAction();
}
