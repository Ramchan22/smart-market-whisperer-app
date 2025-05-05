
import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-border py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SMC Forex Analyzer. All rights reserved.
          </p>
          <div className="mt-2 md:mt-0">
            <p className="text-xs text-muted-foreground">
              Disclaimer: Trading forex involves risk. This app provides analysis, not financial advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
