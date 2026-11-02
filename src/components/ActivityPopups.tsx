"use client";

import { createContext, useContext, type MouseEvent, type ReactNode } from "react";
import ActivityDetail from "@/components/ActivityDetail";
import { useActivities } from "@/i18n/LangProvider";
import { tripTo, useDrives } from "@/lib/driving";
import { ACTIVITY_PARAM } from "@/lib/filtersUrl";
import { nearbyActivities } from "@/lib/recommend";
import { useStartLocation } from "@/lib/startLocation";
import { useOpenActivity } from "@/lib/useOpenActivity";

const OpenContext = createContext<(id: string) => void>(() => {});

/** Lets the links inside it open an activity's details in a popup on the same page. */
export default function ActivityPopups({ initialActivityId, children }: { initialActivityId: string | null; children: ReactNode }) {
  const activities = useActivities();
  const start = useStartLocation();
  const { openId, openDetail, closeDetail } = useOpenActivity(initialActivityId, activities, (id) =>
    id ? `?${ACTIVITY_PARAM}=${id}` : window.location.pathname,
  );
  const open = activities.find((a) => a.id === openId);
  // Road distances are only needed once a popup is open.
  const { drives, failed } = useDrives(open ? start?.coordinates : undefined, activities);
  return (
    <OpenContext.Provider value={openDetail}>
      {children}
      {open && (
        <ActivityDetail
          activity={open}
          trip={tripTo(open, start?.coordinates, drives, failed)}
          start={start}
          nearby={nearbyActivities(open, activities)}
          onSelect={openDetail}
          onClose={closeDetail}
        />
      )}
    </OpenContext.Provider>
  );
}

/** A link to an activity's details. Opening it in a new tab with Ctrl or the middle button still works. */
export function ActivityLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const open = useContext(OpenContext);
  function onClick(e: MouseEvent) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(id);
  }
  return (
    <a href={`?${ACTIVITY_PARAM}=${id}`} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
