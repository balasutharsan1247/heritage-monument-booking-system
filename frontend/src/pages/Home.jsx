import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, CalendarCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-maroon-800 dark:text-maroon-100 mb-6 drop-shadow-sm">Discover Our Heritage</h1>
        <p className="text-xl text-maroon-700 dark:text-maroon-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Book tickets to historical monuments, skip the line with our virtual queue system, and experience history like never before.
        </p>
        <Link to="/monuments" className="bg-maroon-700 hover:bg-maroon-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-xl transition-all hover:-translate-y-1 inline-block">
          Explore Monuments
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full mt-12 px-4">
        <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow border border-maroon-100 dark:border-maroon-800 text-center">
          <div className="bg-maroon-100 dark:bg-maroon-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-maroon-700 dark:text-maroon-200" />
          </div>
          <h3 className="text-xl font-bold mb-2">Beautiful Locations</h3>
          <p className="text-maroon-600 dark:text-maroon-300">Browse through the most exquisite heritage monuments across the region.</p>
        </div>
        <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow border border-maroon-100 dark:border-maroon-800 text-center">
          <div className="bg-maroon-100 dark:bg-maroon-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-8 h-8 text-maroon-700 dark:text-maroon-200" />
          </div>
          <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
          <p className="text-maroon-600 dark:text-maroon-300">Reserve your time slots instantly with zero hassle and absolute clarity.</p>
        </div>
        <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow border border-maroon-100 dark:border-maroon-800 text-center">
          <div className="bg-maroon-100 dark:bg-maroon-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-maroon-700 dark:text-maroon-200" />
          </div>
          <h3 className="text-xl font-bold mb-2">Virtual Queue</h3>
          <p className="text-maroon-600 dark:text-maroon-300">Skip the physical lines. Wait comfortably while tracking your live position.</p>
        </div>
      </div>
    </div>
  );
}