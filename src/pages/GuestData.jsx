import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Building2, Phone, Mail, Tag, MessageSquare, UserPlus, Edit2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EditGuestDialog } from "../components/guest/EditGuestDialog";

const categoryColors = {
  VIP: "bg-amber-50 text-amber-700 border-amber-200",
  Business: "bg-blue-50 text-blue-700 border-blue-200",
  Presse: "bg-purple-50 text-purple-700 border-purple-200",
  Standard: "bg-slate-50 text-slate-600 border-slate-200",
  Speaker: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Sponsor: "bg-pink-50 text-pink-700 border-pink-200",
};

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};
const statusLabels = { pending: "Ausstehend", approved: "Freigegeben", rejected: "Abgelehnt" };

export default function GuestData() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editGuest, setEditGuest] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: registrations } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => eventId
      ? base44.entities.Registration.filter({ event_id: eventId }, "-created_date")
      : base44.entities.Registration.list("-created_date"),
    initialData: [],
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.list(),
    initialData: [],
  });

  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.name]));

  const filtered = registrations.filter((r) => {
    const term = search.toLowerCase();
    const matchSearch =
      r.first_name?.toLowerCase().includes(term) ||
      r.last_name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.company?.toLowerCase().includes(term) ||
      r.phone?.toLowerCase().includes(term);
    const matchCat = filterCategory === "all" || r.category === filterCategory;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Users className="w-6 h-6 text-slate-400" />
              <h1 className="text-2xl font-bold text-slate-900">Gästedaten</h1>
            </div>
            <p className="text-sm text-slate-500 ml-9">{registrations.length} Registrierungen insgesamt</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche nach Name, E-Mail, Firma..."
                className="pl-10 h-10 border-slate-200"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-10 w-44 border-slate-200">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {["VIP", "Business", "Presse", "Standard", "Speaker", "Sponsor"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-10 w-44 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="approved">Freigegeben</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                     {!eventId && <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</TableHead>}
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />E-Mail</span>
                     </TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Telefon</span>
                     </TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Firma</span>
                     </TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Kategorie</span>
                     </TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" />Eingeladen von</span>
                     </TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                       <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Anmerkungen</span>
                     </TableHead>
                     <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aktionen</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={9} className="text-center py-16 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
                        <p>Keine Gäste gefunden</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((reg) => (
                      <TableRow key={reg.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                       {!eventId && (
                         <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                           {eventMap[reg.event_id] || <span className="text-slate-300">—</span>}
                         </TableCell>
                       )}
                       <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                          {reg.first_name} {reg.last_name}
                          {reg.plus_one && (
                            <span className="ml-2 text-xs text-slate-400">(+1{reg.plus_one_name ? `: ${reg.plus_one_name}` : ""})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{reg.email}</TableCell>
                        <TableCell className="text-sm text-slate-600">{reg.phone || <span className="text-slate-300">—</span>}</TableCell>
                        <TableCell className="text-sm text-slate-600">{reg.company || <span className="text-slate-300">—</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${categoryColors[reg.category] || categoryColors.Standard} text-xs`}>
                            {reg.category || "Standard"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[reg.status] || ""} text-xs`}>
                            {statusLabels[reg.status] || reg.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{reg.invited_by || <span className="text-slate-300">—</span>}</TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-xs truncate">{reg.notes || <span className="text-slate-300">—</span>}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditGuest(reg);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-right mt-2">{filtered.length} von {registrations.length} Einträgen</p>
          </motion.div>
          </div>

          <EditGuestDialog
          guest={editGuest}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={() => queryClient.invalidateQueries({ queryKey: ["registrations", eventId] })}
          />
          </div>
          );
          }