
import React, { useState } from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBar, BookOpen, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

const educationTopics = [
  {
    id: 1,
    title: 'Understanding Order Blocks',
    description: 'Learn how to identify and trade using order blocks, a key SMC concept',
    category: 'basics',
    difficulty: 'beginner',
    duration: '12 min',
    image: 'https://source.unsplash.com/random/300x200?chart&sig=1',
    content: `
      <h2>What are Order Blocks?</h2>
      <p>Order blocks are significant price areas where institutional traders have placed their orders. These zones often lead to strong market reactions when revisited.</p>
      
      <h3>Key Characteristics:</h3>
      <ul>
        <li>Usually formed by the last candle before a significant move in the opposite direction</li>
        <li>Often have high volume compared to surrounding candles</li>
        <li>Can be both bullish (buy order blocks) or bearish (sell order blocks)</li>
      </ul>
      
      <h3>How to Identify Order Blocks:</h3>
      <ol>
        <li>Look for a strong momentum move in one direction</li>
        <li>Identify the origin of that move - the last opposing candle</li>
        <li>Mark the high to low range of that candle as the order block</li>
      </ol>
      
      <h3>Trading with Order Blocks:</h3>
      <p>When price returns to an order block, look for confirmation signals like:</p>
      <ul>
        <li>Price rejection (wicks)</li>
        <li>Lower timeframe structure shifts</li>
        <li>Volume increase</li>
      </ul>
    `
  },
  {
    id: 2,
    title: 'Fair Value Gaps (FVG)',
    description: 'Master how to spot and trade fair value gaps for high probability setups',
    category: 'strategy',
    difficulty: 'intermediate',
    duration: '18 min',
    image: 'https://source.unsplash.com/random/300x200?trading&sig=2',
    content: `
      <h2>Understanding Fair Value Gaps (FVG)</h2>
      <p>Fair Value Gaps are areas on the chart where price has moved so quickly that it has left an imbalance. These gaps often get filled as the market seeks equilibrium.</p>
      
      <h3>How to Identify FVGs:</h3>
      <ol>
        <li>Look for three consecutive candles where the second candle creates a gap</li>
        <li>In a bullish FVG: The low of the third candle is higher than the high of the first candle</li>
        <li>In a bearish FVG: The high of the third candle is lower than the low of the first candle</li>
      </ol>
      
      <h3>Why FVGs Are Important:</h3>
      <p>Fair Value Gaps represent price inefficiency. Markets generally try to be as efficient as possible, which is why these gaps tend to get filled over time as "unfinished business."</p>
      
      <h3>Trading Strategies with FVGs:</h3>
      <ul>
        <li>Mean-reversion: Enter trades expecting the gap to be filled</li>
        <li>Use FVGs as profit targets in trending markets</li>
        <li>Look for rejection at FVGs as confirmation for continuation trades</li>
      </ul>
    `
  },
  {
    id: 3,
    title: 'Liquidity Sweeps & Stop Hunts',
    description: 'Understand how institutions collect liquidity before major moves',
    category: 'advanced',
    difficulty: 'advanced',
    duration: '15 min',
    image: 'https://source.unsplash.com/random/300x200?finance&sig=3',
    content: `
      <h2>Liquidity Sweeps & Stop Hunts</h2>
      <p>Liquidity sweeps occur when large market participants deliberately push price beyond obvious support/resistance levels to trigger stop losses and generate liquidity for their larger positions.</p>
      
      <h3>Where Liquidity Accumulates:</h3>
      <ul>
        <li>Above swing highs (sell stops)</li>
        <li>Below swing lows (buy stops)</li>
        <li>At round psychological numbers</li>
        <li>At major support and resistance zones</li>
      </ul>
      
      <h3>Identifying Stop Hunts:</h3>
      <p>Look for these patterns:</p>
      <ol>
        <li>Quick spike beyond a key level</li>
        <li>Immediate reversal after the spike</li>
        <li>Higher volume during the spike</li>
        <li>Often occurs before major market moves</li>
      </ol>
      
      <h3>Trading the Stop Hunt:</h3>
      <p>Two approaches:</p>
      <ul>
        <li>Avoid placing stops at obvious levels where they might get hunted</li>
        <li>Enter counter-trend after a stop hunt completes with tight risk management</li>
      </ul>
    `
  },
  {
    id: 4,
    title: 'Supply & Demand Zones',
    description: 'Learn to identify key areas where price is likely to react',
    category: 'basics',
    difficulty: 'beginner',
    duration: '10 min',
    image: 'https://source.unsplash.com/random/300x200?stocks&sig=4',
    content: `
      <h2>Supply & Demand Zones</h2>
      <p>Supply and demand zones are areas on a chart where price has previously shown significant reversal or consolidation. These zones represent institutional interest levels.</p>
      
      <h3>Supply Zones (Selling Areas):</h3>
      <ul>
        <li>Form at the origin of a strong downward move</li>
        <li>Represent areas where sellers overwhelmed buyers</li>
        <li>Often show a consolidation before the drop</li>
      </ul>
      
      <h3>Demand Zones (Buying Areas):</h3>
      <ul>
        <li>Form at the origin of a strong upward move</li>
        <li>Represent areas where buyers overwhelmed sellers</li>
        <li>Often show a consolidation before the rally</li>
      </ul>
      
      <h3>Trading with Supply & Demand:</h3>
      <p>Key principles:</p>
      <ol>
        <li>Look for fresh zones that haven't been tested multiple times</li>
        <li>Stronger zones form quickly with momentum</li>
        <li>Use lower timeframes to find precise entries within the zone</li>
        <li>Place stops beyond the zone to avoid premature exits</li>
      </ol>
    `
  },
  {
    id: 5,
    title: 'Breaker Blocks Strategy',
    description: 'Advanced technique for trading breaker blocks in trending markets',
    category: 'strategy',
    difficulty: 'intermediate',
    duration: '20 min',
    image: 'https://source.unsplash.com/random/300x200?graph&sig=5',
    content: `
      <h2>Breaker Blocks Strategy</h2>
      <p>Breaker blocks are a specific type of order block that has already been tested and broken. These areas often turn from support to resistance (or vice versa).</p>
      
      <h3>How Breaker Blocks Form:</h3>
      <ol>
        <li>An order block forms (last opposing candle before a momentum move)</li>
        <li>Price later returns to and breaks through this order block</li>
        <li>The broken order block now becomes a breaker block</li>
      </ol>
      
      <h3>Why Breaker Blocks Work:</h3>
      <p>When an order block is broken, it represents a defeat of the orders placed at that level. When price returns to this area, the defeated participants often try to exit their losing positions, reinforcing the new trend direction.</p>
      
      <h3>Trading with Breaker Blocks:</h3>
      <ul>
        <li>Look for price to return to the breaker block after it's been established</li>
        <li>Enter trades in the direction of the break</li>
        <li>Use tight stops beyond the opposing side of the breaker</li>
        <li>Target the next significant level in the trend direction</li>
      </ul>
    `
  },
  {
    id: 6,
    title: 'Institutional Concepts',
    description: 'Understanding how institutional traders operate in the forex market',
    category: 'advanced',
    difficulty: 'advanced',
    duration: '25 min',
    image: 'https://source.unsplash.com/random/300x200?bank&sig=6',
    content: `
      <h2>Institutional Trading Concepts</h2>
      <p>Understanding how large financial institutions approach the market can give retail traders significant edge. Institutions need to manage large positions that can't be entered or exited all at once.</p>
      
      <h3>Key Institutional Behaviors:</h3>
      <ul>
        <li>Liquidity hunting - seeking areas where they can execute large orders</li>
        <li>Position building - accumulating positions over time rather than all at once</li>
        <li>Stopping retail - intentionally triggering retail stop losses before moving in their intended direction</li>
      </ul>
      
      <h3>Market Manipulation Tactics:</h3>
      <ol>
        <li>Stop hunts - pushing price to obvious stop loss areas</li>
        <li>Fake breakouts - pushing price beyond key levels only to reverse</li>
        <li>News spikes - using news events to disguise their intentions</li>
      </ol>
      
      <h3>How to Trade Like an Institution:</h3>
      <p>Key principles:</p>
      <ul>
        <li>Focus on high-liquidity times and instruments</li>
        <li>Look for traps and manipulations rather than obvious setups</li>
        <li>Trade with the bigger trend after manipulations are complete</li>
        <li>Manage risk carefully, knowing that even institutions can be wrong</li>
      </ul>
    `
  },
];

const Education = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const handleStartLearning = (topic) => {
    setSelectedTopic(topic);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <h1 className="text-2xl font-bold mb-2">SMC Education Center</h1>
        <p className="text-muted-foreground mb-6">
          Master Smart Money Concepts with our comprehensive educational resources
        </p>
        
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationTopics.map((topic) => (
                <Card key={topic.id} className="overflow-hidden card-hover">
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={topic.image} 
                      alt={topic.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{topic.difficulty}</Badge>
                      <Badge>{topic.duration}</Badge>
                    </div>
                    <CardTitle className="mt-2">{topic.title}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button className="w-full" onClick={() => handleStartLearning(topic)}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Start Learning
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="basics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationTopics
                .filter(topic => topic.category === 'basics')
                .map((topic) => (
                  <Card key={topic.id} className="overflow-hidden card-hover">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={topic.image} 
                        alt={topic.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">{topic.difficulty}</Badge>
                        <Badge>{topic.duration}</Badge>
                      </div>
                      <CardTitle className="mt-2">{topic.title}</CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleStartLearning(topic)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Start Learning
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="strategy" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationTopics
                .filter(topic => topic.category === 'strategy')
                .map((topic) => (
                  <Card key={topic.id} className="overflow-hidden card-hover">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={topic.image} 
                        alt={topic.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">{topic.difficulty}</Badge>
                        <Badge>{topic.duration}</Badge>
                      </div>
                      <CardTitle className="mt-2">{topic.title}</CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleStartLearning(topic)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Start Learning
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationTopics
                .filter(topic => topic.category === 'advanced')
                .map((topic) => (
                  <Card key={topic.id} className="overflow-hidden card-hover">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={topic.image} 
                        alt={topic.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">{topic.difficulty}</Badge>
                        <Badge>{topic.duration}</Badge>
                      </div>
                      <CardTitle className="mt-2">{topic.title}</CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" onClick={() => handleStartLearning(topic)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Start Learning
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Dialog for displaying education content */}
        <Dialog open={selectedTopic !== null} onOpenChange={(open) => !open && setSelectedTopic(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {selectedTopic && (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-bold">{selectedTopic.title}</DialogTitle>
                      <Badge variant="outline" className="ml-2">{selectedTopic.difficulty}</Badge>
                    </div>
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                  </div>
                  <DialogDescription className="text-muted-foreground">
                    {selectedTopic.description} • {selectedTopic.duration}
                  </DialogDescription>
                </DialogHeader>
                <div 
                  className="mt-4 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: selectedTopic.content }}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
};

export default Education;
