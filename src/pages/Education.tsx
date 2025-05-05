
import React from 'react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBar } from 'lucide-react';

const educationTopics = [
  {
    id: 1,
    title: 'Understanding Order Blocks',
    description: 'Learn how to identify and trade using order blocks, a key SMC concept',
    category: 'basics',
    difficulty: 'beginner',
    duration: '12 min',
    image: 'https://source.unsplash.com/random/300x200?chart&sig=1',
  },
  {
    id: 2,
    title: 'Fair Value Gaps (FVG)',
    description: 'Master how to spot and trade fair value gaps for high probability setups',
    category: 'strategy',
    difficulty: 'intermediate',
    duration: '18 min',
    image: 'https://source.unsplash.com/random/300x200?trading&sig=2',
  },
  {
    id: 3,
    title: 'Liquidity Sweeps & Stop Hunts',
    description: 'Understand how institutions collect liquidity before major moves',
    category: 'advanced',
    difficulty: 'advanced',
    duration: '15 min',
    image: 'https://source.unsplash.com/random/300x200?finance&sig=3',
  },
  {
    id: 4,
    title: 'Supply & Demand Zones',
    description: 'Learn to identify key areas where price is likely to react',
    category: 'basics',
    difficulty: 'beginner',
    duration: '10 min',
    image: 'https://source.unsplash.com/random/300x200?stocks&sig=4',
  },
  {
    id: 5,
    title: 'Breaker Blocks Strategy',
    description: 'Advanced technique for trading breaker blocks in trending markets',
    category: 'strategy',
    difficulty: 'intermediate',
    duration: '20 min',
    image: 'https://source.unsplash.com/random/300x200?graph&sig=5',
  },
  {
    id: 6,
    title: 'Institutional Concepts',
    description: 'Understanding how institutional traders operate in the forex market',
    category: 'advanced',
    difficulty: 'advanced',
    duration: '25 min',
    image: 'https://source.unsplash.com/random/300x200?bank&sig=6',
  },
];

const Education = () => {
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
                    <Button className="w-full">
                      <ChartBar className="mr-2 h-4 w-4" />
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
                      <Button className="w-full">
                        <ChartBar className="mr-2 h-4 w-4" />
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
                      <Button className="w-full">
                        <ChartBar className="mr-2 h-4 w-4" />
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
                      <Button className="w-full">
                        <ChartBar className="mr-2 h-4 w-4" />
                        Start Learning
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Education;
