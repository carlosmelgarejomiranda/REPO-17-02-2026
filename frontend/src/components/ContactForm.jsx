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
    
    const message = `Hola! Me interesa formar parte de Avenue.\n\nNombre: ${formData.name}\nMarca: ${formData.brandName}\nRubro: ${formData.category}\nTeléfono: ${formData.phone}`;
    const whatsappUrl = `https://wa.me/595976691520?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    
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
    <section className="py-14 px-6 relative" style={{ backgroundColor: '#f7f2ed' }} id="contact-form">
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1673010523525-bcf9cfb4b8b5?w=1920&q=80" 
          alt="Neoclassical Interior"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-md mx-auto relative z-10">
        <div className="w-20 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#d4a968' }}></div>
        
        <Card className="border-none shadow-xl" 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #d4a968'
              }}>
          <CardHeader className="text-center pt-6 pb-4">
            <CardTitle className="text-xl md:text-2xl font-light mb-2 italic" 
                       style={{ 
                         color: '#1a1a1a',
                         fontFamily: 'var(--font-primary)'
                       }}>
              {t.form.title}
            </CardTitle>
            <CardDescription className="text-sm" 
                           style={{ 
                             color: '#5a5a5a',
                             fontFamily: 'var(--font-secondary)'
                           }}>
              {t.form.subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#d4a968' }} />
                <p className="text-base font-light italic" 
                   style={{ 
                     color: '#1a1a1a',
                     fontFamily: 'var(--font-primary)'
                   }}>
                  {t.form.success}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs mb-1" 
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
                    className="mt-1 border h-9 text-sm"
                    style={{ borderColor: '#d4a968' }}
                  />
                </div>

                <div>
                  <Label htmlFor="brandName" className="text-xs mb-1" 
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
                    className="mt-1 border h-9 text-sm"
                    style={{ borderColor: '#d4a968' }}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-xs mb-1" 
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
                    className="mt-1 border h-9 text-sm"
                    style={{ borderColor: '#d4a968' }}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs mb-1" 
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
                    className="mt-1 border h-9 text-sm"
                    style={{ borderColor: '#d4a968' }}
                    placeholder="+595..."
                  />
                </div>

                <Button 
                  type="submit" 
                  size="sm" 
                  className="w-full text-sm py-5 transition-all duration-300 hover:scale-102"
                  style={{ 
                    backgroundColor: '#d4a968',
                    border: 'none',
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
        
        <div className="w-20 h-0.5 mx-auto mt-8" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};
