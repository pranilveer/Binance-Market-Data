import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import Dropdown from './Dropdown';
import "../App.css"

Chart.register(CandlestickController, CandlestickElement);

const CryptoChart = () => {
  const [symbol, setSymbol] = useState('ethusdt');
  const [interval, setInterval] = useState('1m');
  const chartRef = useRef(null);
  const ws = useRef(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const savedData = localStorage.getItem(symbol);
    if (savedData) {
      setChartData(JSON.parse(savedData));
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

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const candlestick = data.k;
      const newCandle = {
        x: new Date(candlestick.t),
        o: parseFloat(candlestick.o),
        h: parseFloat(candlestick.h),
        l: parseFloat(candlestick.l),
        c: parseFloat(candlestick.c),
      };

      setChartData((prevData) => {
        const updatedData = [...prevData, newCandle];
        localStorage.setItem(symbol, JSON.stringify(updatedData));
        return updatedData;
      });
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket closed:', event);
    };
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      if (chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }

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
                unit: 'minute',
              },
            }
          }
        }
      });

      return () => {
        chartRef.current.chartInstance.destroy();
      };
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
      <canvas ref={chartRef} id="myChart"></canvas>
    </div>
  );
};

export default CryptoChart;