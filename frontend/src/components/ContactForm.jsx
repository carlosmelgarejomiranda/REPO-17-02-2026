import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { CheckCircle2 } from 'lucide-react';

export const ContactForm = ({ t }) => {
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    category: '',
    phone: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create WhatsApp message
    const message = `Hola! Me interesa formar parte de Avenue.\n\nNombre: ${formData.name}\nMarca: ${formData.brandName}\nRubro: ${formData.category}\nTeléfono: ${formData.phone}`;
    const whatsappUrl = `https://wa.me/595976691520?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    
    // Reset form
    setFormData({
      name: '',
      brandName: '',
      category: '',
      phone: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section className="py-24 px-6 relative" style={{ backgroundColor: '#f7f2ed' }} id="contact-form">
      {/* Neoclassical interior background */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1673010523525-bcf9cfb4b8b5?w=1920&q=80" 
          alt="Neoclassical Interior"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <Card className="border-none shadow-2xl" 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid #d4a968'
              }}>
          <CardHeader className="text-center pt-12 pb-8">
            <CardTitle className="text-3xl md:text-5xl font-light mb-4 italic" 
                       style={{ 
                         color: '#1a1a1a',
                         fontFamily: 'var(--font-primary)'
                       }}>
              {t.form.title}
            </CardTitle>
            <CardDescription className="text-base" 
                           style={{ 
                             color: '#5a5a5a',
                             fontFamily: 'var(--font-secondary)'
                           }}>
              {t.form.subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-12 pb-12">
            {submitted ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-6" style={{ color: '#d4a968' }} />
                <p className="text-xl font-light italic" 
                   style={{ 
                     color: '#1a1a1a',
                     fontFamily: 'var(--font-primary)'
                   }}>
                  {t.form.success}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm mb-2" 
                         style={{ 
                           color: '#1a1a1a',
                           fontFamily: 'var(--font-secondary)',
                           letterSpacing: '0.05em'
                         }}>
                    {t.form.name}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-2 border-2"
                    style={{ borderColor: '#d4a968' }}
                  />
                </div>

                <div>
                  <Label htmlFor="brandName" className="text-sm mb-2" 
                         style={{ 
                           color: '#1a1a1a',
                           fontFamily: 'var(--font-secondary)',
                           letterSpacing: '0.05em'
                         }}>
                    {t.form.brandName}
                  </Label>
                  <Input
                    id="brandName"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    required
                    className="mt-2 border-2"
                    style={{ borderColor: '#d4a968' }}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm mb-2" 
                         style={{ 
                           color: '#1a1a1a',
                           fontFamily: 'var(--font-secondary)',
                           letterSpacing: '0.05em'
                         }}>
                    {t.form.category}
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder={t.form.categoryPlaceholder}
                    required
                    className="mt-2 border-2"
                    style={{ borderColor: '#d4a968' }}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm mb-2" 
                         style={{ 
                           color: '#1a1a1a',
                           fontFamily: 'var(--font-secondary)',
                           letterSpacing: '0.05em'
                         }}>
                    {t.form.phone}
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="mt-2 border-2"
                    style={{ borderColor: '#d4a968' }}
                    placeholder="+595..."
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-base py-6 transition-all duration-300 hover:scale-105 border-2"
                  style={{ 
                    backgroundColor: '#d4a968',
                    borderColor: '#b88f4f',
                    color: '#1a1a1a',
                    fontFamily: 'var(--font-secondary)',
                    letterSpacing: '0.05em'
                  }}
                >
                  {t.form.submit}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};