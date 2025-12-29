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
    <section className="py-20 px-6" style={{ backgroundColor: '#f7f5f2' }} id="contact-form">
      <div className="max-w-2xl mx-auto">
        <Card className="border-none shadow-xl" style={{ backgroundColor: 'white' }}>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a1918' }}>
              {t.form.title}
            </CardTitle>
            <CardDescription className="text-base" style={{ color: '#736c64' }}>
              {t.form.subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#5f9dff' }} />
                <p className="text-xl font-semibold" style={{ color: '#1a1918' }}>
                  {t.form.success}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base" style={{ color: '#1a1918' }}>
                    {t.form.name}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="brandName" className="text-base" style={{ color: '#1a1918' }}>
                    {t.form.brandName}
                  </Label>
                  <Input
                    id="brandName"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-base" style={{ color: '#1a1918' }}>
                    {t.form.category}
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder={t.form.categoryPlaceholder}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base" style={{ color: '#1a1918' }}>
                    {t.form.phone}
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="mt-2"
                    placeholder="+595..."
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: '#61525a', color: 'white' }}
                >
                  {t.form.submit}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};