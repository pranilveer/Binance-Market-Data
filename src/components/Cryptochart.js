import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import Dropdown from './Dropdown';
import "../App.css";

Chart.register(CandlestickController, CandlestickElement);

const CryptoChart = () => {
  const [symbol, setSymbol] = useState('ethusdt');
  const [interval, setInterval] = useState('1m');
  const chartRef = useRef(null);
  const ws = useRef(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem(symbol);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('Loaded data from localStorage:', parsedData);
      setChartData(parsedData);
    }

    connectWebSocket(symbol, interval);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [symbol, interval]);

  const connectWebSocket = (symbol, interval) => {
    if (ws.current) {
      ws.current.close();
    }

    const socketUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const candlestick = data.k;

      // Only process the candlestick if it's closed
      if (candlestick.x) {
        const newCandle = {
          x: new Date(candlestick.t),
          o: parseFloat(candlestick.o),
          h: parseFloat(candlestick.h),
          l: parseFloat(candlestick.l),
          c: parseFloat(candlestick.c),
        };

        console.log('New candle received:', newCandle);
        setChartData((prevData) => {
          const updatedData = [...prevData, newCandle];
          localStorage.setItem(symbol, JSON.stringify(updatedData));
          return updatedData;
        });
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed:', event);
      setTimeout(() => connectWebSocket(symbol, interval), 5000); // Retry connection after 5 seconds
    };
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      // Update or initialize the chart instance
      if (chartRef.current.chartInstance) {
        chartRef.current.chartInstance.data.datasets[0].data = chartData; // Update the dataset
        chartRef.current.chartInstance.update(); // Refresh the chart
      } else {
        chartRef.current.chartInstance = new Chart(ctx, {
          type: 'candlestick',
          data: {
            datasets: [{
              label: 'Candlestick Chart',
              data: chartData,
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'minute', // Change to 'hour' or 'day' for larger time frames
                  displayFormats: {
                    minute: 'HH:mm', // Display format for minutes
                    hour: 'MMM D, HH:mm', // Display format for hours
                  }
                },
                title: {
                  display: true,
                  text: 'Time', // Label for x-axis
                },
                ticks: {
                  autoSkip: true, // Skip ticks automatically if they're too crowded
                  maxTicksLimit: 20, // Limit the number of ticks
                },
                barPercentage: 0.3, // Adjust candlestick width
                categoryPercentage: 0.3, // Adjust spacing between candlesticks
              },
              y: {
                title: {
                  display: true,
                  text: 'Price (USDT)', // Label for y-axis
                },
              }
            }
          }
        });
      }
    }
  }, [chartData]);

  return (
    <div>
      <div className="controls">
        <Dropdown
          label="Select Cryptocurrency"
          options={[
            { value: 'ethusdt', label: 'ETH/USDT' },
            { value: 'bnbusdt', label: 'BNB/USDT' },
            { value: 'dotusdt', label: 'DOT/USDT' },
          ]}
          selected={symbol}
          onChange={setSymbol}
        />
        <Dropdown
          label="Select Timeframe"
          options={[
            { value: '1m', label: '1 Minute' },
            { value: '3m', label: '3 Minutes' },
            { value: '5m', label: '5 Minutes' }
          ]}
          selected={interval}
          onChange={setInterval}
        />
      </div>
      <canvas ref={chartRef} id="myChart" width="800" height="400"></canvas> {/* Set canvas width and height */}
    </div>
  );
};

export default CryptoChart;
