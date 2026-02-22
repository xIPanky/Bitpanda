import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Ticket, Search, Users, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";

const categoryColors = {
  VIP: "bg-amber-50 text-amber-700 border-amber-200",
  Business: "bg-blue-50 text-blue-700 border-blue-200",
  Presse: "bg-purple-50 text-purple-700 border-purple-200",
  Standard: "bg-slate-50 text-slate-600 border-slate-200",
  Speaker: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Sponsor: "bg-pink-50 text-pink-700 border-pink-200",
};

const categories = ["VIP", "Business", "Presse", "Standard", "Speaker", "Sponsor"];

export default function GuestList() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: tickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date"),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Ticket.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket gelöscht");
      setDeleteTarget(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (ticket) => {
      await base44.entities.Ticket.update(ticket.id, { status: "cancelled" });
      if (ticket.registration_id) {
        await base44.entities.Registration.update(ticket.registration_id, { status: "rejected" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      toast.success("Ticket storniert");
    },
  });

  const categoryMutation = useMutation({
    mutationFn: ({ id, category }) => base44.entities.Ticket.update(id, { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const filteredTickets = tickets.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.guest_name?.toLowerCase().includes(term) ||
      t.guest_email?.toLowerCase().includes(term) ||
      t.ticket_code?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gästeliste</h1>
            <p className="text-sm text-slate-500 mt-1">
              {tickets.length} Tickets · {tickets.filter((t) => t.status === "used").length} eingecheckt
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Name, E-Mail, Code..."
              className="pl-10 h-10 border-slate-200"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gast</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-Mail</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategorie</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p>Keine Tickets gefunden</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900">{ticket.guest_name}</TableCell>
                      <TableCell className="text-sm text-slate-600">{ticket.guest_email}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                          {ticket.ticket_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ticket.category || "Standard"}
                          onValueChange={(val) => categoryMutation.mutate({ id: ticket.id, category: val })}
                        >
                          <SelectTrigger className="h-8 text-xs w-32 border-0 bg-transparent p-0 focus:ring-0">
                            <Badge variant="outline" className={`${categoryColors[ticket.category] || categoryColors.Standard} border text-xs cursor-pointer`}>
                              {ticket.category || "Standard"}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {ticket.status === "used" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Eingecheckt
                          </Badge>
                        ) : ticket.status === "cancelled" ? (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Storniert
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <Ticket className="w-3 h-3 mr-1" />
                            Gültig
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {ticket.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => cancelMutation.mutate(ticket.id)}
                              title="Stornieren"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(ticket)}
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Ticket von <strong>{deleteTarget?.guest_name}</strong> wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}