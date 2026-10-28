import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminPredictionView from './AdminPredictionView';

// Mock fetch API globally
global.fetch = vi.fn();

describe('AdminPredictionView', () => {
  let mockPredictResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPredictResponse = null;

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/monuments')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ _id: 'monument1', name: 'Taj Mahal' }]
          })
        });
      }

      if (url.includes('/admin/predictions')) {
        if (mockPredictResponse) {
          return Promise.resolve(mockPredictResponse);
        }
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('renders successfully and loads monuments', async () => {
    render(<AdminPredictionView />);
    
    expect(screen.getByText('Visitor Footfall Prediction')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Taj Mahal')).toBeInTheDocument();
    });
  });

  it('displays prediction results on successful API response', async () => {
    mockPredictResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          monumentId: 'monument1',
          targetDate: '2026-10-15',
          predictedVisitorCount: 4500,
          modelName: 'rf_footfall_predictor',
          modelVersion: '1.2',
          metrics: { mae: 120.5, rmse: 150.2 },
          dataQualityStatus: 'Good',
          trainingDateRange: { start: '2023-01-01', end: '2025-12-31' }
        }
      })
    };

    render(<AdminPredictionView />);
    
    await waitFor(() => {
      expect(screen.getByText('Taj Mahal')).toBeInTheDocument();
    });

    // Select monument
    fireEvent.change(screen.getByTestId('monument-select'), { target: { value: 'monument1' } });
    
    // Select valid date in the future
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const dateStr = targetDate.toISOString().split('T')[0];
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: dateStr } });
    
    // Submit form
    fireEvent.submit(screen.getByTestId('predict-button').closest('form'));

    // Await results
    await waitFor(() => {
      expect(screen.getByTestId('prediction-result')).toBeInTheDocument();
    });

    // Check displayed values
    expect(screen.getByText('4,500')).toBeInTheDocument();
    expect(screen.getByText('rf_footfall_predictor')).toBeInTheDocument();
    expect(screen.getByText('120.50')).toBeInTheDocument();
    expect(screen.getByText('150.20')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText(/prediction, not a guarantee/i)).toBeInTheDocument();
  });

  it('displays error message on failed API response', async () => {
    mockPredictResponse = {
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        message: 'Not enough historical data.'
      })
    };

    render(<AdminPredictionView />);
    
    await waitFor(() => {
      expect(screen.getByText('Taj Mahal')).toBeInTheDocument();
    });

    // Select valid date in the future
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const dateStr = targetDate.toISOString().split('T')[0];
    fireEvent.change(screen.getByTestId('monument-select'), { target: { value: 'monument1' } });
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: dateStr } });
    fireEvent.submit(screen.getByTestId('predict-button').closest('form'));

    // Await error state
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Insufficient Data for Prediction')).toBeInTheDocument();
    expect(screen.getByText('Not enough historical data.')).toBeInTheDocument();
  });
});
