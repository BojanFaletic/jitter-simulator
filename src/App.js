// src/App.js

import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import FFT from 'fft.js';
import { Slider, Typography, Container, Grid, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import 'chart.js/auto';

// Define styles using makeStyles
const useStyles = makeStyles({
  slider: {
    width: '80%',
    margin: '20px auto',
  },
});

const App = () => {
  const classes = useStyles();

  // State variables
  const [frequency, setFrequency] = useState(5); // Hz
  const [jitterDelay, setJitterDelay] = useState(0); // in samples
  const [timeData, setTimeData] = useState([]);
  const [fftData, setFftData] = useState([]);

  const SAMPLE_RATE = 1024; // Samples per second
  const TOTAL_SAMPLES = 1024; // Total samples in the signal

  // Apply jitter by delaying samples randomly
  const applyJitter = (signal, maxDelay) => {
    if (maxDelay === 0) return signal;

    const jittered = [...signal];
    for (let i = 0; i < jittered.length; i++) {
      const delay = Math.floor(Math.random() * (2 * maxDelay + 1)) - maxDelay; // Range: -maxDelay to +maxDelay
      let newIndex = i + delay;
      newIndex = Math.max(0, Math.min(jittered.length - 1, newIndex));
      jittered[i] = signal[newIndex];
    }
    return jittered;
  };

  // Perform FFT
  const computeFFT = (signal) => {
    const fft = new FFT(TOTAL_SAMPLES);
    const out = fft.createComplexArray();
    const input = fft.toComplexArray(signal);
    fft.realTransform(out, input);
    fft.completeSpectrum(out);

    const magnitudes = [];
    for (let i = 0; i < TOTAL_SAMPLES / 2; i++) {
      const re = out[2 * i];
      const im = out[2 * i + 1];
      const mag = Math.sqrt(re * re + im * im);
      magnitudes.push(mag);
    }
    return magnitudes;
  };

  // Update signal and FFT when frequency or jitterDelay changes
  useEffect(() => {
    // Define generateSignal inside useEffect to avoid ESLint warning
    const generateSignal = () => {
      const data = [];
      for (let i = 0; i < TOTAL_SAMPLES; i++) {
        const t = i / SAMPLE_RATE;
        data.push(Math.sin(2 * Math.PI * frequency * t));
      }
      return data;
    };

    const signal = generateSignal();
    const jitteredSignal = applyJitter(signal, jitterDelay);
    setTimeData(jitteredSignal);
    const fftResult = computeFFT(jitteredSignal);
    setFftData(fftResult);
  }, [frequency, jitterDelay]); // Dependencies: frequency and jitterDelay

  // Prepare data for time-domain chart
  const timeChartData = {
    labels: Array.from({ length: TOTAL_SAMPLES }, (_, i) => i),
    datasets: [
      {
        label: 'Time Domain Signal',
        data: timeData,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  // Prepare data for frequency-domain chart
  const fftChartData = {
    labels: Array.from({ length: fftData.length }, (_, i) => (i * SAMPLE_RATE) / TOTAL_SAMPLES),
    datasets: [
      {
        label: 'FFT Magnitude',
        data: fftData,
        backgroundColor: 'rgba(153,102,255,0.6)',
      },
    ],
  };

  return (
    <Container>
      <Box textAlign="center" my={4}>
        <Typography variant="h4">Signal Jitter Simulator with FFT</Typography>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Line
            data={timeChartData}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
              scales: {
                x: { display: true, title: { display: true, text: 'Sample' } },
                y: { display: true, title: { display: true, text: 'Amplitude' } },
              },
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Bar
            data={fftChartData}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
              scales: {
                x: { display: true, title: { display: true, text: 'Frequency (Hz)' } },
                y: { display: true, title: { display: true, text: 'Magnitude' } },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Frequency: {frequency} Hz</Typography>
          <Slider
            className={classes.slider}
            value={frequency}
            min={1}
            max={100}
            step={1}
            onChange={(e, val) => setFrequency(val)}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Jitter Delay: {jitterDelay} samples</Typography>
          <Slider
            className={classes.slider}
            value={jitterDelay}
            min={0}
            max={50}
            step={1}
            onChange={(e, val) => setJitterDelay(val)}
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;
