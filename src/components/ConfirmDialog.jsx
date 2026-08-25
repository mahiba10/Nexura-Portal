import React from "react";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = "Are you sure?", message, confirmLabel = "Confirm", danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-danger/10 text-red-400" : "bg-nexura-500/15 text-nexura-300"}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
