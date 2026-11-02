import { useEffect, useRef, useState } from "react";
import { ACTIVITY_PARAM } from "./filtersUrl";
import type { Activity } from "./types";

/**
 * Which activity's details are open. Opening adds a history entry (?aktivnost=…), so the browser's
 * or phone's back button closes the popup and a copied link opens it again. `urlFor` gives the
 * page's address with that activity open, or with none when given null.
 */
export function useOpenActivity(initialId: string | null, activities: Activity[], urlFor: (id: string | null) => string) {
  const [openId, setOpenId] = useState<string | null>(initialId);
  const pushedEntry = useRef(false);

  useEffect(() => {
    const onBack = () => {
      const id = new URLSearchParams(window.location.search).get(ACTIVITY_PARAM);
      pushedEntry.current = false;
      setOpenId(activities.some((a) => a.id === id) ? id : null);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [activities]);

  function openDetail(id: string) {
    // Switching to another activity inside the popup replaces the entry instead of adding one.
    if (openId) {
      window.history.replaceState(null, "", urlFor(id));
    } else {
      window.history.pushState(null, "", urlFor(id));
      pushedEntry.current = true;
    }
    setOpenId(id);
  }

  function closeDetail() {
    if (pushedEntry.current) {
      // Going back removes the entry we added; the popstate listener then closes the popup.
      window.history.back();
      return;
    }
    // Opened straight from a shared link: there is no entry of ours to go back to.
    window.history.replaceState(null, "", urlFor(null));
    setOpenId(null);
  }

  return { openId, openDetail, closeDetail };
}
