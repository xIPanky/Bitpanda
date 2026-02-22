import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
import { CheckCircle2, XCircle, Ticket, Search, Users } from "lucide-react";
import { useState } from "react";

const categoryColors = {
  VIP: "bg-amber-50 text-amber-700 border-amber-200",
  Business: "bg-blue-50 text-blue-700 border-blue-200",
  Presse: "bg-purple-50 text-purple-700 border-purple-200",
  Standard: "bg-slate-50 text-slate-600 border-slate-200",
  Speaker: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Sponsor: "bg-pink-50 text-pink-700 border-pink-200",
};

export default function GuestList() {
  const [search, setSearch] = useState("");

  const { data: tickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date"),
    initialData: [],
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-slate-400">
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
                        <Badge variant="outline" className={`${categoryColors[ticket.category] || categoryColors.Standard} border text-xs`}>
                          {ticket.category}
                        </Badge>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}