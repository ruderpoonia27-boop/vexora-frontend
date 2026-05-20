import React from 'react';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb7fa2kK0IBoyxQitT0g';

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 32 32"
    aria-hidden="true"
    className="h-9 w-9"
  >
    <circle cx="16" cy="16" r="15" fill="#25D366" />
    <path
      fill="#FFFFFF"
      d="M16.03 5.18c-5.98 0-10.84 4.83-10.84 10.77 0 1.89.49 3.73 1.42 5.36L5.03 27l5.78-1.52a10.85 10.85 0 0 0 5.22 1.33h.01c5.97 0 10.83-4.84 10.83-10.79 0-2.88-1.12-5.58-3.16-7.61a10.8 10.8 0 0 0-7.68-3.23Zm0 18.19h-.01a8.37 8.37 0 0 1-4.26-1.16l-.31-.18-3.2.84.85-3.11-.2-.32a8.33 8.33 0 0 1-1.27-4.43c0-4.63 3.77-8.4 8.41-8.4 2.24 0 4.34.87 5.92 2.46a8.31 8.31 0 0 1 2.45 5.93c0 4.63-3.76 8.39-8.38 8.39Z"
    />
    <path
      fill="#FFFFFF"
      d="M20.31 18.12c-.23-.12-1.37-.68-1.58-.76-.21-.08-.37-.12-.52.12-.15.23-.61.76-.74.92-.13.15-.28.17-.51.06-.23-.12-.98-.36-1.86-1.15-.69-.61-1.15-1.37-1.29-1.6-.13-.23-.02-.36.1-.48.1-.1.23-.27.35-.41.12-.13.15-.23.23-.38.08-.15.04-.29-.02-.41-.06-.12-.52-1.25-.72-1.72-.19-.45-.38-.39-.52-.39h-.45c-.15 0-.39.06-.6.29-.21.23-.79.81-.79 1.98s.81 2.29.92 2.44c.12.15 1.59 2.42 3.85 3.39.54.23.96.37 1.29.47.54.17 1.03.15 1.42.09.44-.06 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.15-.44-.27Z"
    />
  </svg>
);

export const FloatingWhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_CHANNEL_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Open WhatsApp channel"
      className="whatsapp-float fixed bottom-[6.25rem] right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-[#25D366]/35 bg-[rgba(7,18,16,0.92)] text-white shadow-[0_10px_28px_rgba(18,140,126,0.28)] transition-transform duration-200 active:scale-95 md:bottom-6 md:right-6"
    >
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,211,102,0.18),transparent_62%)]" />
      <span className="relative z-10 drop-shadow-[0_0_12px_rgba(37,211,102,0.45)]">
        <WhatsAppIcon />
      </span>
    </a>
  );
};

export default FloatingWhatsAppButton;
