// src/App.js

import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import FFT from 'fft.js';
import {
  Slider,
  Typography,
  Container,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import 'chart.js/auto';

// Define styles using makeStyles
const useStyles = makeStyles({
  sliderContainer: {
    width: '80%',
    margin: '20px auto',
  },
  formControl: {
    width: '80%',
    margin: '20px auto',
  },
});

const App = () => {
  const classes = useStyles();

  // State variables
  const [frequency, setFrequency] = useState(5); // Hz
  const [jitterDistribution, setJitterDistribution] = useState('Uniform'); // 'Uniform' or 'Gaussian'
  const [jitterDelay, setJitterDelay] = useState(0); // Used for Uniform distribution
  const [jitterMean, setJitterMean] = useState(0); // Used for Gaussian distribution
  const [jitterStdDev, setJitterStdDev] = useState(5); // Used for Gaussian distribution
  const [timeData, setTimeData] = useState([]);
  const [fftData, setFftData] = useState([]);

  const SAMPLE_RATE = 1024; // Samples per second
  const TOTAL_SAMPLES = 1024; // Total samples in the signal

  // Helper function to generate random Gaussian numbers (Box-Muller transform)
  const randomGaussian = () => {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); // Avoid log(0)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  // Generate sine wave signal
  const generateSignal = () => {
    const data = [];
    for (let i = 0; i < TOTAL_SAMPLES; i++) {
      const t = i / SAMPLE_RATE;
      data.push(Math.sin(2 * Math.PI * frequency * t));
    }
    return data;
  };

  // Apply jitter based on selected distribution
  const applyJitter = (signal) => {
    const jittered = [...signal];
    for (let i = 0; i < jittered.length; i++) {
      let delay = 0;
      if (jitterDistribution === 'Uniform') {
        delay =
          Math.floor(
            Math.random() * (2 * jitterDelay + 1)
          ) - jitterDelay; // Range: -jitterDelay to +jitterDelay
      } else if (jitterDistribution === 'Gaussian') {
        delay = Math.round(randomGaussian() * jitterStdDev + jitterMean);
        // Optionally, constrain delay within a range
        const maxDelay = jitterStdDev * 3; // 99.7% within 3 sigma
        delay = Math.max(-maxDelay, Math.min(maxDelay, delay));
      }

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

  // Update signal and FFT when dependencies change
  useEffect(() => {
    const signal = generateSignal();
    const jitteredSignal = applyJitter(signal);
    setTimeData(jitteredSignal);
    const fftResult = computeFFT(jitteredSignal);
    setFftData(fftResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    frequency,
    jitterDistribution,
    jitterDelay,
    jitterMean,
    jitterStdDev,
  ]);

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
    labels: Array.from({ length: fftData.length }, (_, i) =>
      (i * SAMPLE_RATE) / TOTAL_SAMPLES
    ),
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
        {/* Charts Side by Side */}
        <Grid item xs={12} md={6}>
          <Line
            data={timeChartData}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Sample',
                  },
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Amplitude',
                  },
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Bar
            data={fftChartData}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Frequency (Hz)',
                  },
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: 'Magnitude',
                  },
                },
              },
            }}
          />
        </Grid>

        {/* Controls */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>
            Frequency: {frequency} Hz
          </Typography>
          <Slider
            className={classes.sliderContainer}
            value={frequency}
            min={1}
            max={100}
            step={1}
            onChange={(e, val) => setFrequency(val)}
            valueLabelDisplay="auto"
          />

          <FormControl className={classes.formControl}>
            <InputLabel id="jitter-distribution-label">
              Jitter Distribution
            </InputLabel>
            <Select
              labelId="jitter-distribution-label"
              value={jitterDistribution}
              label="Jitter Distribution"
              onChange={(e) => setJitterDistribution(e.target.value)}
            >
              <MenuItem value="Uniform">Uniform</MenuItem>
              <MenuItem value="Gaussian">Gaussian</MenuItem>
            </Select>
          </FormControl>

          {jitterDistribution === 'Uniform' && (
            <>
              <Typography gutterBottom>
                Jitter Delay: {jitterDelay} samples
              </Typography>
              <Slider
                className={classes.sliderContainer}
                value={jitterDelay}
                min={0}
                max={50}
                step={1}
                onChange={(e, val) => setJitterDelay(val)}
                valueLabelDisplay="auto"
              />
            </>
          )}

          {jitterDistribution === 'Gaussian' && (
            <>
              <Typography gutterBottom>
                Jitter Mean: {jitterMean} samples
              </Typography>
              <Slider
                className={classes.sliderContainer}
                value={jitterMean}
                min={-10}
                max={10}
                step={1}
                onChange={(e, val) => setJitterMean(val)}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom>
                Jitter Std Dev: {jitterStdDev} samples
              </Typography>
              <Slider
                className={classes.sliderContainer}
                value={jitterStdDev}
                min={1}
                max={20}
                step={1}
                onChange={(e, val) => setJitterStdDev(val)}
                valueLabelDisplay="auto"
              />
            </>
          )}
        </Grid>

        {/* Additional Polish: Spacer or additional controls if needed */}
        <Grid item xs={12} md={6}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Typography variant="body1" color="textSecondary">
              Adjust the frequency and jitter parameters using the sliders on the left.
              Observe how different jitter distributions affect the time domain signal
              and its frequency spectrum.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;
