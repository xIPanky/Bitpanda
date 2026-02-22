import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function Register() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  useEffect(() => {
    if (eventId) {
      window.location.href = createPageUrl(`EventDetails?event_id=${eventId}`);
    }
  }, [eventId]);

  return null;
}