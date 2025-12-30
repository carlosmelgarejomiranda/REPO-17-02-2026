import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Building, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const PRICING = {
  2: 250000,
  4: 450000,
  6: 650000,
  8: 800000
};

const DURATION_OPTIONS = [2, 4, 6, 8];

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
    return date >= today;
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
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
      <div className="max-w-2xl mx-auto p-6">
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4a968' }}>
              <Calendar className="w-8 h-8" style={{ color: '#0d0d0d' }} />
            </div>
            <h2 className="text-2xl font-light italic mb-4" style={{ color: '#f5ede4' }}>
              ¡Reserva Confirmada!
            </h2>
            <div className="space-y-2 mb-6" style={{ color: '#a8a8a8' }}>
              <p><strong style={{ color: '#d4a968' }}>Fecha:</strong> {success.date}</p>
              <p><strong style={{ color: '#d4a968' }}>Horario:</strong> {success.start_time} - {success.end_time}</p>
              <p><strong style={{ color: '#d4a968' }}>Duración:</strong> {success.duration_hours} horas</p>
              <p><strong style={{ color: '#d4a968' }}>Precio:</strong> {success.price.toLocaleString()} Gs</p>
            </div>
            <p className="text-sm mb-6" style={{ color: '#a8a8a8' }}>
              Hemos enviado un email de confirmación a <strong style={{ color: '#d4a968' }}>{success.email}</strong>
            </p>
            <Button
              onClick={() => {
                setSuccess(null);
                setStep(1);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              Nueva Reserva
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  step >= s ? 'text-black' : ''
                }`}
                style={{
                  backgroundColor: step >= s ? '#d4a968' : '#333',
                  color: step >= s ? '#0d0d0d' : '#666'
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className="w-12 h-0.5"
                  style={{ backgroundColor: step > s ? '#d4a968' : '#333' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Select Date */}
      {step === 1 && (
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardHeader>
            <CardTitle className="text-center italic" style={{ color: '#f5ede4' }}>
              Selecciona una Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={prevMonth}
                style={{ color: '#d4a968' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="text-lg font-medium" style={{ color: '#f5ede4' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <Button
                variant="ghost"
                onClick={nextMonth}
                style={{ color: '#d4a968' }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-sm font-medium"
                  style={{ color: '#d4a968' }}
                >
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((date, index) => (
                <div
                  key={index}
                  className={`text-center py-3 rounded cursor-pointer transition-all ${
                    date && isDateSelectable(date) ? 'hover:scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: date && selectedDate === formatDate(date) ? '#d4a968' : 
                                    date && isDateSelectable(date) ? '#2a2a2a' : 'transparent',
                    color: date && selectedDate === formatDate(date) ? '#0d0d0d' :
                           date && isDateSelectable(date) ? '#f5ede4' : '#444',
                    cursor: date && isDateSelectable(date) ? 'pointer' : 'default'
                  }}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date ? date.getDate() : ''}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Time & Duration */}
      {step === 2 && (
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                style={{ color: '#d4a968' }}
              >
                <ChevronLeft className="w-5 h-5 mr-1" /> Volver
              </Button>
              <CardTitle className="italic" style={{ color: '#f5ede4' }}>
                {selectedDate}
              </CardTitle>
              <div style={{ width: '80px' }} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Duration Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3" style={{ color: '#a8a8a8' }}>
                Duración de la reserva:
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((hours) => (
                  <button
                    key={hours}
                    className={`p-3 rounded border transition-all ${
                      selectedDuration === hours ? 'border-2' : ''
                    }`}
                    style={{
                      backgroundColor: selectedDuration === hours ? 'rgba(212, 169, 104, 0.2)' : '#2a2a2a',
                      borderColor: selectedDuration === hours ? '#d4a968' : '#333',
                      color: '#f5ede4'
                    }}
                    onClick={() => {
                      setSelectedDuration(hours);
                      setSelectedTime(null);
                    }}
                  >
                    <div className="font-medium">{hours}h</div>
                    <div className="text-xs mt-1" style={{ color: '#d4a968' }}>
                      {PRICING[hours].toLocaleString()} Gs
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <h4 className="text-sm font-medium mb-3" style={{ color: '#a8a8a8' }}>
              Horario de inicio:
            </h4>
            {loading ? (
              <div className="text-center py-8" style={{ color: '#a8a8a8' }}>
                Cargando disponibilidad...
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {Array.from({ length: 22 - 9 }, (_, i) => i + 9).map((hour) => {
                  const available = isTimeSlotAvailable(hour);
                  const endHour = hour + selectedDuration;
                  
                  return (
                    <button
                      key={hour}
                      disabled={!available || endHour > 22}
                      className={`p-3 rounded border transition-all ${
                        selectedTime === `${hour.toString().padStart(2, '0')}:00` ? 'border-2' : ''
                      }`}
                      style={{
                        backgroundColor: selectedTime === `${hour.toString().padStart(2, '0')}:00` 
                          ? '#d4a968' 
                          : available && endHour <= 22 
                            ? '#2a2a2a' 
                            : '#1a1a1a',
                        borderColor: selectedTime === `${hour.toString().padStart(2, '0')}:00` 
                          ? '#d4a968' 
                          : '#333',
                        color: selectedTime === `${hour.toString().padStart(2, '0')}:00` 
                          ? '#0d0d0d' 
                          : available && endHour <= 22 
                            ? '#f5ede4' 
                            : '#444',
                        cursor: available && endHour <= 22 ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => available && endHour <= 22 && handleTimeClick(hour)}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTime && (
              <div className="mt-6 p-4 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                <p style={{ color: '#a8a8a8' }}>
                  <strong style={{ color: '#d4a968' }}>Resumen:</strong> {selectedDate} de {selectedTime} a {
                    `${(parseInt(selectedTime.split(':')[0]) + selectedDuration).toString().padStart(2, '0')}:00`
                  } ({selectedDuration}h) - <strong style={{ color: '#d4a968' }}>{PRICING[selectedDuration].toLocaleString()} Gs</strong>
                </p>
                <Button
                  className="mt-4 w-full"
                  style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                  onClick={() => setStep(3)}
                >
                  Continuar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Reservation Form */}
      {step === 3 && (
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                style={{ color: '#d4a968' }}
              >
                <ChevronLeft className="w-5 h-5 mr-1" /> Volver
              </Button>
              <CardTitle className="italic" style={{ color: '#f5ede4' }}>
                Datos de Reserva
              </CardTitle>
              <div style={{ width: '80px' }} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="mb-6 p-4 rounded" style={{ backgroundColor: '#2a2a2a', borderLeft: '3px solid #d4a968' }}>
              <p style={{ color: '#f5ede4' }}>
                <strong style={{ color: '#d4a968' }}>Fecha:</strong> {selectedDate}
              </p>
              <p style={{ color: '#f5ede4' }}>
                <strong style={{ color: '#d4a968' }}>Horario:</strong> {selectedTime} - {
                  `${(parseInt(selectedTime.split(':')[0]) + selectedDuration).toString().padStart(2, '0')}:00`
                }
              </p>
              <p style={{ color: '#f5ede4' }}>
                <strong style={{ color: '#d4a968' }}>Precio:</strong> {PRICING[selectedDuration].toLocaleString()} Gs
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                    <User className="w-4 h-4 inline mr-1" /> Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded border"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                    <Phone className="w-4 h-4 inline mr-1" /> Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded border"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                  <Mail className="w-4 h-4 inline mr-1" /> Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                  <Building className="w-4 h-4 inline mr-1" /> Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-3 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>

              <div className="pt-4 border-t" style={{ borderColor: '#333' }}>
                <h4 className="text-sm font-medium mb-3" style={{ color: '#d4a968' }}>
                  <FileText className="w-4 h-4 inline mr-1" /> Datos de Facturación
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                      Razón Social
                    </label>
                    <input
                      type="text"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                      className="w-full p-3 rounded border"
                      style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                      RUC
                    </label>
                    <input
                      type="text"
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      className="w-full p-3 rounded border"
                      style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs mb-4" style={{ color: '#666' }}>
                  * El pago se realiza en Avenue antes de ingresar al estudio.
                </p>
                <Button
                  type="submit"
                  className="w-full py-6 text-lg"
                  disabled={submitting}
                  style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                >
                  {submitting ? 'Procesando...' : 'Confirmar Reserva'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
