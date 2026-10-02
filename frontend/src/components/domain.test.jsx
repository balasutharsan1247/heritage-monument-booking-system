import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MonumentCard } from './monuments/MonumentCard';
import { QueueStatusWidget } from './tickets/QueueStatusWidget';

describe('Domain Components', () => {
  describe('MonumentCard', () => {
    const mockMonument = {
      _id: 'monument123',
      name: 'Taj Mahal',
      location: 'Agra, Uttar Pradesh',
      description: 'UNESCO World Heritage ivory-white marble mausoleum.',
      capacity: 500,
      baseTicketPrice: 50,
      isActive: true,
      imageUrl: '/images/taj-mahal.jpg',
    };

    it('renders monument information, price and open badge', () => {
      render(
        <BrowserRouter>
          <MonumentCard monument={mockMonument} />
        </BrowserRouter>
      );

      expect(screen.getByText('Taj Mahal')).toBeInTheDocument();
      expect(screen.getByText(/Agra, Uttar Pradesh/i)).toBeInTheDocument();
      expect(screen.getByText('₹50')).toBeInTheDocument();
      expect(screen.getByText(/Open Today/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view details & book/i })).toHaveAttribute('href', '/monuments/monument123');
    });
  });

  describe('QueueStatusWidget', () => {
    it('renders waiting queue metrics', () => {
      const queueStatus = {
        status: 'waiting',
        entriesAhead: 5,
        estimatedWait: 25,
      };

      render(<QueueStatusWidget queueStatus={queueStatus} tokenNumber="823419" />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/25/i)).toBeInTheDocument();
      expect(screen.getByText(/People Ahead/i)).toBeInTheDocument();
    });

    it('renders urgent callout when visitor token is called', () => {
      const queueStatus = {
        status: 'called',
        tokenNumber: '823419',
      };

      render(<QueueStatusWidget queueStatus={queueStatus} tokenNumber="823419" />);

      expect(screen.getByText(/it's your turn/i)).toBeInTheDocument();
      expect(screen.getByText(/please proceed to entrance counter/i)).toBeInTheDocument();
    });
  });
});
