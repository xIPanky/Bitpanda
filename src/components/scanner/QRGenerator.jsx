import React from "react";

// Simple QR code generator using a canvas-based approach
// Generates a QR-like visual representation using the ticket code
export default function QRGenerator({ value, size = 200 }) {
  // We'll use a free QR code API to generate the QR code image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=svg&margin=8`;

  return (
    <div className="inline-flex items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <img
        src={qrUrl}
        alt={`QR Code: ${value}`}
        width={size}
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}