import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QRCodeCard = ({ value, size = 190, tokenNumber }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-white p-3 rounded-2xl border border-sandstone-300 shadow-xs">
        <QRCodeSVG
          value={value || 'HERITAGE-TICKET'}
          size={size}
          level="H"
          includeMargin={true}
          aria-label={`QR Code for Token ${tokenNumber || ''}`}
        />
      </div>

      {tokenNumber && (
        <div className="mt-3">
          <div className="text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">
            Token
          </div>
          <div className="text-2xl font-black font-sans text-maroon-900 tracking-wider">
            #{tokenNumber}
          </div>
        </div>
      )}
    </div>
  );
};
