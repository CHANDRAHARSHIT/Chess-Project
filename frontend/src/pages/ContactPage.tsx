import React, { useEffect } from 'react';
import PartnerCTA from '../components/PartnerCTA';

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Contact Us | XLChess';
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-bg flex flex-col justify-center py-12">
      <PartnerCTA />
    </div>
  );
}
