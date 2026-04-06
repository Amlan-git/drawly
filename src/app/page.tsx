/**
 * Drawly Homepage — canvas-first landing page
 *
 * Per Build Pack: "The landing page is the canvas."
 * User can start drawing immediately without auth.
 * Local work persists across refresh via localStorage.
 */

import DrawlyCanvas from "@/components/canvas/DrawlyCanvas";
import AppHeader from "@/components/shell/AppHeader";

export default function HomePage() {
  return (
    <main>
      <DrawlyCanvas />
      <AppHeader />
    </main>
  );
}
