import { redirect } from "next/navigation";

export default async function HomePage() {
  // The old iframe used fixture records and therefore could not safely open
  // production listings or submit bids. The live marketplace is now the
  // canonical home for every visitor.
  redirect("/explore");
}
