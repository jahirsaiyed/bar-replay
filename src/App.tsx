import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Play, Pause, SkipBack, SkipForward, DollarSign } from 'lucide-react';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

function App() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [paperTradingBalance, setPaperTradingBalance] = useState(10000);
  const [position, setPosition] = useState({ type: '', quantity: 0, entryPrice: 0 });

  useEffect(() => {
    generateMockData();
  }, []);

  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      const newChart = createChart(chartContainerRef.current, {
        width: 800,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
      });
      const newSeries = newChart.addCandlestickSeries();
      newSeries.setData(chartData.slice(0, currentIndex + 1));
      setChart(newChart);
      setSeries(newSeries);

      return () => {
        newChart.remove();
      };
    }
  }, [chartData, currentIndex]);

  const generateMockData = () => {
    const mockData: ChartData[] = [];
    const startDate = new Date('2023-01-01');
    const startPrice = 100;

    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const open = startPrice + Math.random() * 10 - 5;
      const close = open + Math.random() * 10 - 5;
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;

      mockData.push({
        time: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      });
    }

    setChartData(mockData);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentIndex < chartData.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, chartData]);

  useEffect(() => {
    if (series && currentIndex < chartData.length) {
      series.update(chartData[currentIndex]);
    }
  }, [currentIndex, series, chartData]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleSkipBack = () => setCurrentIndex((prevIndex) => Math.max(0, prevIndex - 1));
  const handleSkipForward = () => setCurrentIndex((prevIndex) => Math.min(chartData.length - 1, prevIndex + 1));

  const handleTrade = (action: 'buy' | 'sell') => {
    const currentPrice = chartData[currentIndex]?.close || 0;
    const tradeQuantity = 1; // Simplified: always trade 1 share

    if (action === 'buy' && paperTradingBalance >= currentPrice * tradeQuantity) {
      setPaperTradingBalance((prev) => prev - currentPrice * tradeQuantity);
      setPosition({ type: 'long', quantity: tradeQuantity, entryPrice: currentPrice });
    } else if (action === 'sell' && position.type === 'long') {
      const profit = (currentPrice - position.entryPrice) * position.quantity;
      setPaperTradingBalance((prev) => prev + currentPrice * position.quantity + profit);
      setPosition({ type: '', quantity: 0, entryPrice: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">TradingView-like Bar Replay</h1>
      <div ref={chartContainerRef} className="mb-4"></div>
      <div className="flex space-x-2 mb-4">
        <button onClick={handleSkipBack} className="p-2 bg-blue-500 text-white rounded"><SkipBack size={20} /></button>
        {isPlaying ? (
          <button onClick={handlePause} className="p-2 bg-blue-500 text-white rounded"><Pause size={20} /></button>
        ) : (
          <button onClick={handlePlay} className="p-2 bg-blue-500 text-white rounded"><Play size={20} /></button>
        )}
        <button onClick={handleSkipForward} className="p-2 bg-blue-500 text-white rounded"><SkipForward size={20} /></button>
      </div>
      <div className="mb-4">
        <p>Date: {chartData[currentIndex]?.time || 'Loading...'}</p>
        <p>Close: ${chartData[currentIndex]?.close.toFixed(2) || 'Loading...'}</p>
      </div>
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-xl font-semibold mb-2">Paper Trading</h2>
        <p className="mb-2">Balance: ${paperTradingBalance.toFixed(2)}</p>
        <div className="flex space-x-2">
          <button onClick={() => handleTrade('buy')} className="p-2 bg-green-500 text-white rounded flex items-center">
            <DollarSign size={16} className="mr-1" /> Buy
          </button>
          <button onClick={() => handleTrade('sell')} className="p-2 bg-red-500 text-white rounded flex items-center">
            <DollarSign size={16} className="mr-1" /> Sell
          </button>
        </div>
        {position.type && (
          <p className="mt-2">
            Current Position: {position.quantity} shares @ ${position.entryPrice.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;