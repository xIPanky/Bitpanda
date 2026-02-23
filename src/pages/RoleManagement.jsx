import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RoleManagement() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");
  const queryClient = useQueryClient();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }).then(res => res[0]),
    enabled: !!eventId,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const eventUsers = allUsers.filter(u => u.assigned_events?.includes(eventId));

  const addUserMutation = useMutation({
    mutationFn: async () => {
      if (!newEmail || !newPassword) {
        toast.error("Email und Passwort erforderlich");
        return;
      }
      // Hinweis: Neue Benutzer können nur über die Einladungsfunktion erstellt werden
      toast.info("Benutzerverwaltung muss über das Admin-Panel erfolgen");
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId) => {
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        const updatedEvents = (user.assigned_events || []).filter(id => id !== eventId);
        const updatedRoles = { ...user.event_roles };
        delete updatedRoles[eventId];
        await base44.entities.User.update(userId, {
          assigned_events: updatedEvents,
          event_roles: updatedRoles
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Benutzer entfernt");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        await base44.entities.User.update(userId, {
          event_roles: { ...(user.event_roles || {}), [eventId]: role }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Rolle aktualisiert");
    },
  });

  if (!eventId) return <div className="p-6" style={{color:"#555"}}>Event nicht gefunden</div>;

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background:"#070707" }}>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div className="mb-8">
            <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 transition-colors" style={{color:"#444"}} onMouseEnter={e=>e.currentTarget.style.color="#beff00"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Rollenverteilung</h1>
            <p className="text-xs mt-0.5 uppercase tracking-widest" style={{color:"#444"}}>{event?.name}</p>
          </div>

          <div className="rounded-2xl p-6 space-y-5" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#333"}}>Benutzer verwalten</p>
            <div className="space-y-3">
              {eventUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl" style={{background:"#111",border:"1px solid #1a1a1a"}}>
                  <div>
                    <p className="font-semibold text-white text-sm">{user.full_name}</p>
                    <p className="text-xs mt-0.5" style={{color:"#555"}}>{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={user.event_roles?.[eventId]||"user"} onChange={e=>updateRoleMutation.mutate({userId:user.id,role:e.target.value})}
                      className="h-9 px-3 rounded-xl text-sm text-white outline-none" style={{background:"#0d0d0d",border:"1px solid #1e1e1e"}}>
                      <option value="user" style={{background:"#111"}}>User</option>
                      <option value="guest_list_manager" style={{background:"#111"}}>Gästelistenmanager</option>
                    </select>
                    <button onClick={()=>removeUserMutation.mutate(user.id)} className="p-2 rounded-lg transition-all" style={{color:"#ef4444",background:"#1a0505",border:"1px solid #2a0808"}}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {eventUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs uppercase tracking-widest" style={{color:"#2a2a2a"}}>Keine Benutzer zugewiesen</p>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-3" style={{borderTop:"1px solid #141414"}}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#333"}}>Neuen Benutzer hinzufügen</p>
              <p className="text-xs leading-relaxed" style={{color:"#444"}}>Benutzer können nur über Einladungen hinzugefügt werden. Nutze die Einladungsfunktion im Admin-Bereich.</p>
              <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider opacity-40" style={{background:"#111",color:"#555",border:"1px solid #1e1e1e"}}>
                <Plus className="w-3.5 h-3.5" /> Über Admin-Panel einladen
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}