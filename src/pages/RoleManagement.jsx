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

  if (!eventId) return <div className="p-6 text-slate-500">Event nicht gefunden</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Rollenverteilung</h1>
            <p className="text-sm text-slate-500 mt-1">{event?.name}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Benutzer verwalten</h3>
              <div className="space-y-3">
                {eventUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.event_roles?.[eventId] || "user"}
                        onChange={(e) => updateRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                        className="h-9 px-2 rounded-md border border-slate-200 text-sm bg-white"
                      >
                        <option value="user">User</option>
                        <option value="guest_list_manager">Gästelistenmanager</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUserMutation.mutate(user.id)}
                        className="text-red-600 hover:bg-red-50 h-9"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {eventUsers.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Keine Benutzer zugewiesen</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Neuen Benutzer hinzufügen</h4>
              <p className="text-xs text-slate-500 mb-4">Benutzer können nur über Einladungen hinzugefügt werden. Nutze die Einladungsfunktion im Admin-Bereich, um neue Benutzer zu erstellen und dann weise ihnen hier eine Event-Rolle zu.</p>
              <Button disabled className="gap-2">
                <Plus className="w-4 h-4" />
                Benutzer über Admin-Panel einladen
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}