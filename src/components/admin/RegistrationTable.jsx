import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Mail, User2, Loader2, Pencil } from "lucide-react";
import EditRegistrationDialog from "./EditRegistrationDialog";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Ausstehend", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Freigegeben", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Abgelehnt", color: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

const categoryColors = {
  VIP: "bg-amber-50 text-amber-700 border-amber-200",
  Business: "bg-blue-50 text-blue-700 border-blue-200",
  Presse: "bg-purple-50 text-purple-700 border-purple-200",
  Standard: "bg-slate-50 text-slate-600 border-slate-200",
  Speaker: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Sponsor: "bg-pink-50 text-pink-700 border-pink-200",
};

export default function RegistrationTable({
  registrations,
  onApprove,
  onReject,
  onCategoryChange,
  onEdit,
  processingId,
  filterStatus,
  filterCategory,
  onFilterStatusChange,
  onFilterCategoryChange,
}) {
  const [editTarget, setEditTarget] = React.useState(null);

  const handleSave = async (form) => {
    await onEdit(form);
    setEditTarget(null);
  };

  return (
    <>
    {editTarget && (
      <EditRegistrationDialog
        registration={editTarget}
        onSave={handleSave}
        onClose={() => setEditTarget(null)}
      />
    )}
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Filters */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-900 mr-auto">Registrierungen</h3>
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Ausstehend</SelectItem>
            <SelectItem value="approved">Freigegeben</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Presse">Presse</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Speaker">Speaker</SelectItem>
            <SelectItem value="Sponsor">Sponsor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gast</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontakt</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategorie</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Datum</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <User2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p>Keine Registrierungen gefunden</p>
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => {
                  const status = statusConfig[reg.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const isProcessing = processingId === reg.id;
                  return (
                    <motion.tr
                      key={reg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{reg.first_name} {reg.last_name}</p>
                          {reg.company && <p className="text-xs text-slate-500 mt-0.5">{reg.company}</p>}
                          {reg.plus_one && <p className="text-xs text-amber-600 mt-0.5">+ {reg.plus_one_name || "Begleitperson"}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {reg.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reg.category || "Standard"}
                          onValueChange={(val) => onCategoryChange(reg.id, val)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs border-0 p-0">
                            <Badge variant="outline" className={`${categoryColors[reg.category || "Standard"]} border text-xs`}>
                              {reg.category || "Standard"}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(categoryColors).map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${status.color} border text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {reg.created_date ? format(new Date(reg.created_date), "dd.MM.yyyy") : "–"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {reg.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => onApprove(reg)}
                                className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                Freigeben
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => onReject(reg.id)}
                                className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Ablehnen
                              </Button>
                            </>
                          )}
                          {reg.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() => onApprove(reg)}
                              className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                              Doch freigeben
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}