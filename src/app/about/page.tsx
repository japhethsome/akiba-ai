import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Akiba Yangu | Meet the Team Behind SME Growth",
  description: "Learn about the mission of Akiba Yangu and the talented team in Kenya building AI-driven inventory solutions for small businesses.",
};

import AboutClient from "./AboutClient";

export default function AboutPage() {
  return <AboutClient />;
}
