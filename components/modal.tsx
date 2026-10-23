'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Janela modal baseada no <dialog> nativo (foco, Esc e acessibilidade incluídos). */
export function Modal({ open, onClose, label, eyebrow, children }: {
  open: boolean;
  onClose: () => void;
  label: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-label={label}
      ref={ref}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <>
          <div className='modal-top'>
            <div className='eyebrow'>{eyebrow}</div>
            <button type='button' aria-label='Fechar' onClick={onClose}><X size={21} /></button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}

export async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? { cache: 'no-store' } : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({})) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error || 'Não foi possível contactar o servidor. Tente novamente.');
  return data;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
