import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { MonumentCard } from './monuments/MonumentCard';
import { QueueStatusWidget } from './tickets/QueueStatusWidget';
import { TicketCard } from './tickets/TicketCard';
import { AuthContext } from '../context/AuthContext';

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

    it('renders "View Details" button when staff is logged in', () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: { role: 'staff' } }}>
            <MonumentCard monument={mockMonument} />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByRole('link', { name: /^view details$/i })).toHaveAttribute('href', '/monuments/monument123');
      expect(screen.queryByRole('link', { name: /view details & book/i })).not.toBeInTheDocument();
    });

    it('renders "View Details" button when admin is logged in', () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ user: { role: 'admin' } }}>
            <MonumentCard monument={mockMonument} />
          </AuthContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByRole('link', { name: /^view details$/i })).toHaveAttribute('href', '/monuments/monument123');
      expect(screen.queryByRole('link', { name: /view details & book/i })).not.toBeInTheDocument();
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

  describe('TicketCard', () => {
    const baseTicket = {
      _id: 'ticket456',
      tokenNumber: '823419',
      visitDate: '2026-10-15',
      slotStart: '10:00 AM',
      slotEnd: '12:00 PM',
      status: 'booked',
      numberOfPeople: 2,
    };

    it('uses Taj Mahal image as default when monument has no image', () => {
      const ticketWithoutImage = {
        ...baseTicket,
        monumentId: {
          name: 'Sun Temple',
          location: 'Konark, Odisha',
        },
      };

      render(
        <BrowserRouter>
          <TicketCard ticket={ticketWithoutImage} />
        </BrowserRouter>
      );

      expect(screen.getByText('Sun Temple')).toBeInTheDocument();
      const img = screen.getByRole('img', { name: 'Sun Temple' });
      expect(img).toHaveAttribute('src', '/images/taj-mahal.jpg');
    });

    it('uses Taj Mahal image as default when monumentId is an unpopulated ID', () => {
      const ticketWithIdOnly = {
        ...baseTicket,
        monumentId: 'monument123',
      };

      render(
        <BrowserRouter>
          <TicketCard ticket={ticketWithIdOnly} />
        </BrowserRouter>
      );

      const img = screen.getByRole('img', { name: 'Heritage Monument' });
      expect(img).toHaveAttribute('src', '/images/taj-mahal.jpg');
    });

    it('renders provided monument imageUrl when present', () => {
      const ticketWithImage = {
        ...baseTicket,
        monumentId: {
          name: 'Qutub Minar',
          location: 'Delhi',
          imageUrl: '/images/qutub-minar.jpg',
        },
      };

      render(
        <BrowserRouter>
          <TicketCard ticket={ticketWithImage} />
        </BrowserRouter>
      );

      expect(screen.getByText('Qutub Minar')).toBeInTheDocument();
      const img = screen.getByRole('img', { name: 'Qutub Minar' });
      expect(img).toHaveAttribute('src', '/images/qutub-minar.jpg');
    });
  });
});
