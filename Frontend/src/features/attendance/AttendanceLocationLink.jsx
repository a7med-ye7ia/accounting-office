import React from 'react';

export default function AttendanceLocationLink({ latitude, longitude, accuracy }) {
  if (latitude == null || longitude == null) return <span>غير متاح</span>;
  const url = `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <a href={url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
        📍 عرض الموقع
      </a>
      {accuracy != null && <span className="text-[11px] text-appSubtext">الدقة: {Math.round(accuracy)} م</span>}
    </span>
  );
}
