import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Building, FileText, ChevronLeft, ChevronRight, ArrowRight, Check, Camera, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { trackSelectBookingDate, trackSelectTimeSlot, trackStudioBooking } from '../utils/analytics';

const PRICING = {
  2: 250000,
  4: 450000,
  6: 650000,
  8: 800000
};

const DURATION_OPTIONS = [2, 4, 6, 8];

// Hero image for the booking page
const BOOKING_HERO = 'https://images.pexels.com/photos/35465931/pexels-photo-35465931.jpeg?auto=compress&cs=tinysrgb&w=1920';

export const BookingCalendar = ({ t, user, onBookingComplete }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: select date, 2: select time, 3: form
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    company: user?.company || '',
    razon_social: user?.razon_social || '',
    ruc: user?.ruc || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        company: user.company || prev.company,
        razon_social: user.razon_social || prev.razon_social,
        ruc: user.ruc || prev.ruc
      }));
    }
  }, [user]);

  // Fetch availability when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailability = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reservations/availability/${date}`);
      const data = await response.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateSelectable = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Must be at least tomorrow (1 day in advance)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return date >= tomorrow;
  };

  const handleDateClick = (date) => {
    if (isDateSelectable(date)) {
      setSelectedDate(formatDate(date));
      setSelectedTime(null);
      setStep(2);
    }
  };

  const handleTimeClick = (hour) => {
    setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
    setStep(3);
  };

  const isTimeSlotAvailable = (hour) => {
    if (!availability) return false;
    
    // Check if all hours for the selected duration are available
    for (let i = 0; i < selectedDuration; i++) {
      const checkHour = hour + i;
      if (checkHour >= 22) return false;
      
      const slot = availability.slots.find(s => s.hour === checkHour);
      if (!slot || !slot.available) return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones de uso del espacio para continuar');
      return;
    }
    
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({
          date: selectedDate,
          start_time: selectedTime,
          duration_hours: selectedDuration,
          ...formData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Error al crear reserva');
      }

      const reservation = await response.json();
      
      // Track studio booking
      trackStudioBooking({
        reservation_id: reservation.reservation_id,
        date: selectedDate,
        time_slot: selectedTime,
        duration: selectedDuration,
        total_price: PRICING[selectedDuration]
      });
      
      setSuccess(reservation);
      
      if (onBookingComplete) {
        onBookingComplete(reservation);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prevMonthDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prevMonthDate);
    }
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          {/* Success Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10 p-10 text-center">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a968]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d4a968]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#d4a968] flex items-center justify-center">
                <Check className="w-10 h-10 text-black" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
                ¡Reserva <span className="italic text-[#d4a968]">Confirmada</span>!
              </h2>
              <p className="text-gray-400 mb-8">Tu sesión ha sido agendada exitosamente</p>
              
              {/* Reservation Details */}
              <div className="space-y-4 mb-8 p-6 rounded-xl bg-white/5 border border-white/10 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fecha</span>
                  <span className="text-white font-medium">{success.date}</span>
                </div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Horario</span>
                  <span className="text-white font-medium">{success.start_time} - {success.end_time}</span>
                </div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duración</span>
                  <span className="text-white font-medium">{success.duration_hours} horas</span>
                </div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total</span>
                  <span className="text-[#d4a968] text-xl font-medium">{success.price.toLocaleString()} Gs</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-8">
                Confirmación enviada a <span className="text-[#d4a968]">{success.email}</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => {
                    setSuccess(null);
                    setStep(1);
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }}
                  className="flex-1 py-6 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
                >
                  Nueva Reserva
                </Button>
                <a 
                  href="/studio"
                  className="flex-1 py-4 px-6 border border-white/20 text-white font-medium rounded-md hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  Volver al Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div className="absolute inset-0">
          <img src={BOOKING_HERO} alt="Avenue Studio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/50" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <a href="/studio" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Studio</span>
          </a>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px bg-[#d4a968]"></div>
            <span className="text-[#d4a968] text-sm tracking-[0.2em] uppercase">Reservar</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight">
            Agenda tu <span className="italic text-[#d4a968]">sesión</span>
          </h1>
        </div>
      </section>

      {/* Progress Steps - Editorial Style */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {[
            { num: 1, label: 'Fecha' },
            { num: 2, label: 'Horario' },
            { num: 3, label: 'Datos' }
          ].map((s, index) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                    step >= s.num 
                      ? 'bg-[#d4a968] text-black' 
                      : 'bg-white/5 border border-white/20 text-gray-500'
                  }`}
                >
                  {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs tracking-wider uppercase ${step >= s.num ? 'text-[#d4a968]' : 'text-gray-600'}`}>
                  {s.label}
                </span>
              </div>
              {index < 2 && (
                <div className={`flex-1 max-w-[60px] h-px transition-colors ${step > s.num ? 'bg-[#d4a968]' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Select Date */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto px-6 pb-20">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10">
            <div className="p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-light text-white mb-2 text-center">
                Selecciona una <span className="italic text-[#d4a968]">fecha</span>
              </h2>
              <p className="text-gray-500 text-center mb-8">Elige el día para tu sesión en Avenue Studio</p>
              
              {/* Same-day notice */}
              <div className="mb-8 p-4 rounded-xl bg-[#d4a968]/10 border border-[#d4a968]/30 text-center">
                <p className="text-gray-300 text-sm">
                  📅 Reservas con al menos <span className="text-[#d4a968] font-medium">1 día de anticipación</span>. 
                  Para hoy, <a href="https://wa.me/595973666000" target="_blank" rel="noopener noreferrer" className="text-[#d4a968] underline hover:no-underline">contactanos por WhatsApp</a>.
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={prevMonth}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-[#d4a968] hover:border-[#d4a968] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-light text-white">
                  {monthNames[currentMonth.getMonth()]} <span className="text-[#d4a968]">{currentMonth.getFullYear()}</span>
                </h3>
                <button
                  onClick={nextMonth}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-[#d4a968] hover:border-[#d4a968] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center py-3 text-xs font-medium text-[#d4a968] uppercase tracking-wider">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div
                    key={index}
                    className={`text-center py-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      date && isDateSelectable(date) 
                        ? 'hover:bg-[#d4a968] hover:text-black' 
                        : ''
                    } ${
                      date && selectedDate === formatDate(date)
                        ? 'bg-[#d4a968] text-black font-medium'
                        : date && isDateSelectable(date)
                          ? 'bg-white/5 text-white hover:scale-105'
                          : 'text-gray-700'
                    }`}
                    style={{ cursor: date && isDateSelectable(date) ? 'pointer' : 'default' }}
                    onClick={() => date && handleDateClick(date)}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Time & Duration */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto px-6 pb-20">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10">
            <div className="p-8 md:p-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#d4a968] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Cambiar fecha</span>
                </button>
                <div className="px-4 py-2 rounded-full bg-[#d4a968]/20 border border-[#d4a968]/30">
                  <span className="text-[#d4a968] text-sm font-medium">{selectedDate}</span>
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-2 text-center">
                Elige <span className="italic text-[#d4a968]">duración y horario</span>
              </h2>
              <p className="text-gray-500 text-center mb-10">Selecciona cuántas horas necesitas y el horario de inicio</p>

              {/* Duration Selection */}
              <div className="mb-10">
                <h4 className="text-sm font-medium mb-4 text-gray-400 uppercase tracking-wider">
                  Duración de la sesión
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DURATION_OPTIONS.map((hours) => (
                    <button
                      key={hours}
                      className={`relative p-5 rounded-xl border transition-all duration-300 group ${
                        selectedDuration === hours 
                          ? 'border-[#d4a968] bg-[#d4a968]/10' 
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                      onClick={() => {
                        setSelectedDuration(hours);
                        setSelectedTime(null);
                      }}
                    >
                      {selectedDuration === hours && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-[#d4a968]" />
                        </div>
                      )}
                      <div className={`text-2xl font-light mb-1 ${selectedDuration === hours ? 'text-[#d4a968]' : 'text-white'}`}>
                        {hours}h
                      </div>
                      <div className={`text-sm ${selectedDuration === hours ? 'text-[#d4a968]' : 'text-gray-500'}`}>
                        {PRICING[hours].toLocaleString()} Gs
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h4 className="text-sm font-medium mb-4 text-gray-400 uppercase tracking-wider">
                  Horario de inicio
                </h4>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando disponibilidad...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {Array.from({ length: 22 - 9 }, (_, i) => i + 9).map((hour) => {
                      const available = isTimeSlotAvailable(hour);
                      const endHour = hour + selectedDuration;
                      const isSelected = selectedTime === `${hour.toString().padStart(2, '0')}:00`;
                      
                      return (
                        <button
                          key={hour}
                          disabled={!available || endHour > 22}
                          className={`py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-[#d4a968] text-black'
                              : available && endHour <= 22
                                ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                : 'bg-transparent text-gray-700 cursor-not-allowed'
                          }`}
                          onClick={() => available && endHour <= 22 && handleTimeClick(hour)}
                        >
                          {hour.toString().padStart(2, '0')}:00
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary & Continue */}
              {selectedTime && (
                <div className="mt-10 p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Tu reserva</p>
                      <p className="text-white text-lg">
                        {selectedDate} · {selectedTime} - {`${(parseInt(selectedTime.split(':')[0]) + selectedDuration).toString().padStart(2, '0')}:00`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">Total</p>
                      <p className="text-[#d4a968] text-2xl font-light">{PRICING[selectedDuration].toLocaleString()} Gs</p>
                    </div>
                  </div>
                  <button
                    className="w-full py-4 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    onClick={() => setStep(3)}
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Reservation Form */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto px-6 pb-20">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10">
            <div className="p-8 md:p-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#d4a968] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Cambiar horario</span>
                </button>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-2 text-center">
                Completa tus <span className="italic text-[#d4a968]">datos</span>
              </h2>
              <p className="text-gray-500 text-center mb-8">Información para confirmar tu reserva</p>

              {/* Reservation Summary */}
              <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-[#d4a968]/10 to-transparent border-l-2 border-[#d4a968]">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Fecha</p>
                    <p className="text-white font-medium">{selectedDate}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Horario</p>
                    <p className="text-white font-medium">
                      {selectedTime} - {`${(parseInt(selectedTime.split(':')[0]) + selectedDuration).toString().padStart(2, '0')}:00`}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total</p>
                    <p className="text-[#d4a968] text-xl font-medium">{PRICING[selectedDuration].toLocaleString()} Gs</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Data */}
                <div>
                  <h4 className="text-sm font-medium mb-4 text-[#d4a968] uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Datos Personales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Nombre y Apellido *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Teléfono *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                        placeholder="+595 9XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-400">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-400">Empresa (opcional)</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                {/* Billing Section */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium mb-4 text-[#d4a968] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Datos de Facturación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Razón Social</label>
                      <input
                        type="text"
                        value={formData.razon_social}
                        onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                        className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                        placeholder="Razón social"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">RUC</label>
                      <input
                        type="text"
                        value={formData.ruc}
                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                        className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                        placeholder="Número de RUC"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                  {/* Terms and Conditions Checkbox */}
                  <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded border-white/30 bg-white/10 text-[#d4a968] focus:ring-[#d4a968] focus:ring-offset-0 focus:ring-offset-transparent"
                      />
                      <span className="text-sm text-gray-300 leading-relaxed">
                        He leído y acepto los{' '}
                        <Link 
                          to="/studio/terminos-condiciones" 
                          target="_blank"
                          className="text-[#d4a968] underline hover:no-underline"
                        >
                          términos y condiciones de uso del espacio
                        </Link>
                        {' '}de Avenue Studio
                      </span>
                    </label>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-4 text-center">
                    * El pago se realiza en Avenue antes de ingresar al estudio.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || !acceptedTerms}
                    className="w-full py-5 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium text-lg rounded-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Confirmar Reserva</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/studio" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
            ← Volver a Avenue Studio
          </a>
          <div className="flex items-center gap-6">
            <a href="/shop" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">E-commerce</a>
            <a href="/studio/ugc" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">UGC Creators</a>
            <a href="https://wa.me/595973666000" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  );
};
