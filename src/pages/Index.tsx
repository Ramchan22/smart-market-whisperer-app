
import React from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ForexChart from '@/components/Dashboard/ForexChart';
import TradeSuggestions from '@/components/Dashboard/TradeSuggestions';
import WatchList from '@/components/Dashboard/WatchList';
import SMCPatterns from '@/components/Dashboard/SMCPatterns';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <h1 className="text-2xl font-bold mb-6">Smart Money Concepts Forex Analysis</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ForexChart />
          </div>
          <div>
            <TradeSuggestions />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WatchList />
          </div>
          <div>
            <SMCPatterns />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
