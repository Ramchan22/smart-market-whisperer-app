
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="border-b border-border sticky top-0 z-10 bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">SMC Forex Analyzer</h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/education" className="font-medium hover:text-primary transition-colors">
            Education
          </Link>
          <Link to="/settings" className="font-medium hover:text-primary transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
        </nav>
        
        <div className="md:hidden">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
